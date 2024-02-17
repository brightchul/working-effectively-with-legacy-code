# 6장 고칠 것은 많고 시간은 없고

실제로 코드 변경을 위해 의존 관계를 제거하고 테스트 루틴을 작성하는 작업은 개발자의 시간을 많이 빼앗는다. 하지만 결국 대부분은 개발 시간과 시행착오를 출여준다. 테스트 루틴이 준비되어 있었기 때문에 코드 변경에 드는 시간, 즉 오류를 포착해서 절약한 시간 + 오류 탐색에 드는 시간을 줄여준다. 

시간 압박이 주어진 상황에서 테스트 루틴 작성여부를 판단하는데 가장 문제가 되는 것은 기능 구현에 걸리는 시간을 알 수 없다는 점이다. 레거시 코드의 경우, 정밀하게 시간을 추정하는 것은 매우 어려운 일이다. 관련 추정 기법은 16장을 참고하자. 

시간이 없을때 가장 빠른 방법으로 해당 기능을 구현하려는 유혹에 빠지기 쉽다. 건설적으로 이러한 문제에 접근하기 위한 방법에 대해서 24장을 참고하자.

당장 변경해야 할 클래스가 있다면, 테스트 하네스 내에서 해당 클래스의 인스턴스 생성을 시도한다. 생성이 불가능하다면 9장, 10장을 참조하자. 그래도 어렵다면 시도 중인 코드 변경을 자세히 조사하자. 이번 장은 완전히 새로운 코드를 작성해서 코드 변경에 대처하는 몇가지 기법들을 설명할 것이다.

## 발아 메소드 

시스템에 새로운 기능을 추가해야 하는데 이 기능을 완전히 새로운 코드로 표현할 수 있다면, 새로운 메소드로 이 기능을 구현한 후 이 메소드를 필요한 위치에서 호출하는 방법을 사용할 수 있다. 

```typescript
class TransactionGate {
 
  postEntries(entries: Array) {
    for (const entry of entries) {
      entry.postDate();
    }
    this.transactionBundle.getListManager().add(entries);
  }
}

// 신규 항목인지 검사하는 코드를 추가한다. 

class TransactionGate {
 
  postEntries(entries: Array) {
    const entriesToAdd = [];  // 추가할 신규 항목

    for (const entry of entries) {

      // 신규 항목인지 검사
      if(!this.transactionBundle.getListManager().hasEntry(entry) {
        entry.postDate();
        entriesToAdd.push(entry)
      }
    }
    this.transactionBundle.getListManager().add(entries);
  }
}

```
새로 추가된 코드와 기존의 코드 사이에 구별이 없으며 코드가 더 불분명해졌다. `날짜 설정`과 `중복 항목 검사`라는 두 개의 동작이 섞여 있기 때문이다. 또한 임시 변수(entriesToAdd)를 추가하면서 새로운 코드를 불러들이기 쉬워졌다.

이것을 수정해보자. 중복 항목 제거를 다른 연산으로 취급할 수 있다.

```typescript
class TransactionGate {
 
  uniqueEntries(entries: Array) {
    const result = [];

    for (const entry of entries) {
      if(!this.transactionBundle.getListManager().hasEntry(entry)) {
        result.push(entry);
      }
    }
    return result;
  }

  postEntries(entries: Array) {
    const entriesToAdd = this.uniqueEntries(entries);

    for (const entry of entries) {
      entry.postDate();
    }
    this.transactionBundle.getListManager().add(entries);
  }
}
```

중복 항목이 아닌 항목을 위한 코드를 추가하려면, 해당 코드를 위한 메소드를 작성하고 그 메소드를 여기서 호출하면 된다. 연동하는 코드가 더 필요하다면, 새로 클래스를 하나 만들고 추가 메소드들을 이 클래스로 이동시키면 된다. 

### 발아 메소드의 작성 순서
1. 어느 부분에 코드 변경이 필요한지 식별한다. 
2. 메소드 내의 특정 위치에서 일련의 명령문으로서 구현할 수 있는 변경이라면, 필요한 처리를 수행하는 신규 메소드를 호출하는 코드를 작성한 후 주석 처리한다. 
3. 호출되는 메소드가 필요로 하는 지역 변수를 확인하고, 이 변수들을 신규 메소드 호출의 인수로서 전달한다. 
4. 호출하는 메소드에 값을 반환해야 하는지 여부를 결정한다. 값을 반환해야 한다면, 반환 값을 변수에 대입하도록 호출 코드를 변경한다. 
5. 새롭게 추가되는 메소드를 테스트 주도 개발 방법을 사용해 작성한다.
6. 앞서 주석처리했던 신규 메소드 호출 코드의 주석을 제거한다. 

독립된 한 개의 기능으로서 코드를 추가하는 경우나 메소드의 테스트 루틴이 아직 준비되지 않은 경우에는 발아 메소드의 사용을 권장한다. 코드를 인라인 형태로 추가하는 것보다 훨씬 바람직한 결과로 이어지기 때문이다. 

클래스의 의존 관계가 너무 복잡해서 많은 수의 생성자 인수를 모방해야 한다면 null 값을 전달하는 것이다. 아니면 발아 메소드를 public static으로 선언해보자. 


### 장점

- 기존 코드와 새로운 코드를 확실하게 구분할 수 있다.
- 영향받는 변수들을 파악할 수 있어서 코드의 정확성도 쉽게 판단할 수 있다.

### 단점

- 이 메소드를 사용하는 것은 원래의 메소드와 그 클래스를 잠시 포기하는 것과 같다. 
- 기존 메소드는 상당량의 복잡한 코드와 한 개의 신규 발아 메소드가 포함되는 형태가 될 수 있다.
- 이렇게 일부 위치에 대해서만 작업하면 코드의 의도를 이해하기 힘들어지기 때문에 기존 메소드는 만들다 만 것 같은 상태가 되어 버린다. 
- 나중에 테스트 루틴으로 보호할때 추가적인 작업을 해야 한다.

## 발아 클래스

객체 생성과 관련된 의존 관계가 많이 존재하면 클래스의 인스턴스 생성이 어렵거나, 많은 수의 의존관계들이 숨겨져 있을수도 있다. 이런 문제들을 해결하려면 광범위하게 리팩토링을 수행해 의존 관계를 제거해서 테스트 하네스 내에서 클래스를 컴파일 할 수 있게 만들어야 한다. 

이런 경우에는 변경에 필요한 기능을 별도의 클래스로서 추출한 후 이 클래스를 기존 클래스에서 이용하는 방법을 사용할 수 있다. 

예를 들어보자

```typescript
class QuarterlyReportGenerator {
  database: any;
  beginDate: any;
  endDate: any;

  generate() {
    const results = this.database.queryResults(this.beginDate, this.endDate);
    let pageText = "";
    pageText += `<html><head><title>"Quarterly Report"</title></head><body><table>`;

    if (results.size() !== 0) {
      for (const one of results) {
        pageText += "<tr>";
        pageText += `<td>${one.department}</td>`;
        pageText += `<td>${one.manager}</td>`;
        pageText += `<td>${one.netProfit / 100}</td>`;
        pageText += `<td>${one.operatingExpense / 100}</td>`;
        pageText += "</tr>";
      }
    } else {
      pageText += "No results for this period";
    }

    pageText += "</table>";
    pageText += "</body>";
    pageText += "</html>";
    return pageText;
  }
}
```

위의 코드에서 HTML 테이블에 헤더 행을 추가한다고 가정하자. 
이 클래스가 매우 큰 상황이라고 한다면 이 변경은 소규모 클래스로 구현할 수 있다. 


```typescript


// 테이블 헤더 추가를 위해 새로운 클래스를 추가
class QuarterlyReportTableHeaderProducer {
  makeHeader() {
    return `
    <tr>
      <td>Department</td>
      <td>Manager</td>
      <td>Profit</td>
      <td>Expenses</td>
    </tr>`;
  }
}

class QuarterlyReportGenerator {
  database: any;
  beginDate: any;
  endDate: any;

  generate() {
    const results = this.database.queryResults(this.beginDate, this.endDate);
    let pageText = "";
    pageText += `<html><head><title>"Quarterly Report"</title></head><body><table>`;

    // 인스턴스 생성후 테이블 헤더를 추가
    const producer = new QuarterlyReportTableHeaderProducer();
    pageText += producer.makeHeader()

    if (results.size() !== 0) {
      for (const one of results) {
        pageText += "<tr>";
        pageText += `<td>${one.department}</td>`;
        pageText += `<td>${one.manager}</td>`;
        pageText += `<td>${one.netProfit / 100}</td>`;
        pageText += `<td>${one.operatingExpense / 100}</td>`;
        pageText += "</tr>";
      }
    } else {
      pageText += "No results for this period";
    }

    pageText += "</table>";
    pageText += "</body>";
    pageText += "</html>";
    return pageText;
  }
}

```

위의 방법을 이용한 유일한 이유는 의존 관계의 복잡성에서 벗어나기 위한 것이다. 

이제 이 클래스를 QuarterlyReportTableHeaderGenerator라 명명하고 generate() 를 갖는 인터페이스를 갖게 하자.

이렇게 하면 QuarterlyReportTableHeaderGenerator 클래스, QuarterlyReportGenerator 클래스 둘다 문자열 값을 반환하는 generate() 메소드를 포함하며, 인터페이스 클래스를 정의한 후 이 클래스들에 상속해서 공통의 코드를 활용할 수 있다. 

```typescript

// js에는 소멸자가 없기 때문에 C++소멸자 ~HTMLGenerator는 생략
class HTMLGenerator {
  abstract generate() {} 
}

class QuarterlyReportTableHeaderGenerator extends HTMLGenerator{
  generate() : string {}
}

class QuarterlyReportGenerator extends HTMLGenerator {
  generate() : string {}
}

```

### 발아 클래스를 작성하는 2가지 경우 

1. 어떤 클래스에 완전히 새로운 역할을 추가하고 싶을 경우
2. 기존 클래스에 약간의 기능을 추가하고 싶지만, 그 클래스를 테스트 하네스 내에서 테스트할 수 없는 경우

### 발아 클래스를 작성하는 순서 
1. 어느 부분의 코드를 변경해야 하는지 식별한다.
2. 메소드 내의 특정 위치에서 일련의 명령문으로서 변경을 구현할 수 있다면, 변경을 구현할 클래스에 적합한 이름을 생각한다. 이어서 해당 위치에 그 클래스의 객체를 생성하는 코드를 삽입하고, 클래스 내의 메소드를 호출하는 코드를 작성한다. 그리고 이 코드를 주석 처리한다. 
3. 호출 메서드의 지역 변수 중에 필요한 것을 결정하고, 이 변수들을 클래스의 생성자가 호출될 떄의 인수로 만든다. 
4. 발아 클래스가 호출 메소드에 결과값을 반환해야 하는지 판단한다. 값을 반환해야 한다면 그 값을 제공할 메소드를 클래스에 추가하고, 이 메소드를 호출해 반환 값을 받아오는 코드를 호출 메소드에 추가한다. 
5. 새로운 클래스를 테스트 주도 개발로 작성한다.
6. 앞서 주석 처리했던 주석을 제거하고, 객체 생성과 호출을 활성화 한다. 


### 장점

발아 클래스의 가장 큰 장점은 코드를 직접 재작성하는 경우보다 확신을 갖고 변경 작업을 진행할 수 있다는 것이다. 

### 단점

발아 클래스의 단점은 메커니즘이 복잡하다는 것이다. 발아클래스는 추상적인 처리 부분과 다른 클래스 내의 처리 부분으로 이뤄지기 대문에 이해하기 어렵다. 이런 경우에는 원래 하나의 클래스에서 변경을 수행했어야 할 것을 안전한 변경 작업을 위해 여러 개의 클래스로 쪼갠 것으로 봐야 한다.

## 포장 메소드

처음 메소드가 작성될 떄의 의도는 하나의 동작만을 제공하기 위함이다. 그리고 나중에 코드를 추가될때 그 기유가 기존 코드와 동시에 실행되기 때문일 때가 있는데 이는 "일시적 결합 temporal coupling" 이라 불리던 현상으로 과도하게 사용되면 코드의 품질을 저하시킨다. 

따라서 동작을 추가해야 할 때 그리 복잡하지 않은 기법들을 사용할 필요가 있다. 포장 메소드 wrap method이다.

```typescript
1. 직원의 타임카드를 집계
2. 급여 정보를 PayDispatcher 객체로 보낸다. 

class Employee { 
  pay() {
    const amount = new Money();
    for (const card of this.timeCards) {
      if (this.payPeriod.contains(this.date)) {
        amount.add(card.getHours() * this.payRate);
      }
    }
    this.payDispatcher.pay(this, this.date, amount);
  }
}


```

```typescript
+추가 : 급여를 지급할 때 직원 이름으로 파일을 갱신해 별도의 보고서 작성 소프트웨어로 보내야 한다. 

class Employee {
  private void dispatchPayment() {   // pay -> dispatchPayment로 변경
    const amount = new Money();
    for (const card of this.timeCards) {
      if (this.payPeriod.contains(this.date)) {
        amount.add(card.getHours() * this.payRate);
      }
    }
    this.payDispatcher.pay(this, this.date, amount);
  }
  public void pay() {
    logPayment();
    dispatchPayment();
  }

  private void logPayment() {
    // ....
  }
}

```
기존 메소드와 이름이 같은 메소드를 새로 생성하고 기존 코드에 처리를 위임한다.    
이 포장 메소드는 기존 메소드의 전후에 새로운 동작을 추가하고자 할 때 사용한다. 

### 작성 단계
1. 변경해야 할 메소드를 식별한다.
2. 변경이 메소드 내의 특정 위치에서 일련의 명령문으로 구현 가능하다면, 메소드 이름을 바꾸고 기존 메소드와 동일한 이름과 서명을 갖는 메소드를 새로 작성한다. 이 때 서명을 그대로 유지해야 한다. 
3. 새로운 메소드에서 기존 메소드를 호출하도록 한다.
4. 새로운 기능을 위한 메소드를 테스트 주도 개발을 통해 작성하고, 이 메소드를 단계 2에서 작성한 신규메소드에서 호출한다. 

**또다른 형태의 포장 메소드**

아직 호출된 적이 없는 새로운 메소드를 추가하고자 할때 사용한다.     
여기서는 pay만 호출하거나 makeLoggedPayment로 호출하거나 둘중 하나를 선택할 수 있다.

### 작성 단계
1. 변경하고자 하는 메소드를 식별한다.
2. 변경이 메소드 내의 특정 위치에서 일련의 명령문으로 구현가능하다면, 변경을 구현할 메소드를 테스트 주도 개발에 의해 새로 작성한다.
3. 새 메소드와 기존 메소드를 호출하는 별도의 메소드를 작성한다. 

```typescript
class Employee {
  makeLoggedPayment() {
    logPayment();
    pay();
  }

  pay(): void {
    // ...
  }

  private logPayment(): void {
    // ....
  }
}
```

### 장점

포장 메소드는 테스트가 끝난 신규 기능을 애플리케이션에 추가할 수 있는 좋은 방법이다. 포장 메소드는 기존 메소드의 길이가 변하지 않는다.

또한 신규 기능이 기존 기능과 분명히 독립적으로 만들어진다는 것도 장점이다. 하나의 목적을 가진 코드가 별도의 목적을 가진 코드와 섞이지 않는다. 

### 단점

부적절한 이름을 붙이기 쉽다. 

## 포장 클래스

포장 메소드를 클래스 수준으로 확장한 것이 포장 클래스이다.     
시스템에 동작을 추가해야 할 때, 그 동작을 그 메소드를 사용하는 다른 클래스에 추가할 수 있다.

```typescript

class Employee { 
  pay() {
    const amount = new Money();
    for (const card of this.timeCards) {
      if (this.payPeriod.contains(this.date)) {
        amount.add(card.getHours() * this.payRate);
      }
    }
    this.payDispatcher.pay(this, this.date, amount);
  }
}

// +추가 : 특정 직원에게 급여를 지급한 사실을 기록하고 싶다
// +추가 : 구현체 추출 혹은 인터페이스 추출 기법을 사용해 포장 클래스가 인터페이스를 구현한다.
// LoggingEmployee가 Employee 인터페이스를 구현한다.
// 아래는 데코레이터 패턴
class LoggingEmployee extends Employee {
  constructor(employee : Employee) {
    this.employee = employee;
  }

  pay(): void {
    this.logPayment();
    this.employee.pay();
  }

  private logPayment(): void {
    // .... 
  }
}
```

위와 같은 기법을 데코레이터 패턴이라고 부른다.     
다른 클래스를 포장하는 객체들을 생성한 후, 이 객체들을 차례대로 전달하는 것이다.     
포장 클래스는 내부에 포장되는 클래스와 동일한 인터페이스를 가져야 한다.      
포장 클래스는 호출하는 쪽은 기존과 동일한 방법으로 호출할 수 있다. 

> 데코레이터 패턴
> 이 패턴을 사용할 때는 일련의 동작을 정의하는 추상 클래스를 정의한 후에 그 추상 클래스를 상속받는 서브클래스를 작성하고, 생성자에서는 추상 클래스의 인스턴스를 받아서 각 메소드의 본문을 제공한다. 
> 데코레이터 패턴을 사용하는 경우, 포장 대상인 클래스 중에서 적어도 한 개의 기초 클래스가 존재해야 한다. 
> 데코레이터 패턴은 유용하지만, 데코레이터 내의 데코레이터가 포함된 코드를 참조하는 것은 양파 껍질을 벗기는 것과 비슷하니 남용을 하지 말자.

        
아래는 데코레이터 대신 별도의 클래스를 두고 employee 객체를 전달받아 사용하는 예시이다.
```typescript
class LoggingPayDispatcher {
  
  constructor(employee: Employee) {
    this.employee = employee;
  }

  pay(): void {
    this.employee.pay();
    this.logPayment();
  }

  private logPayment() {
    // ...
  }

}
```

포장 클래스의 핵심은 신규 동작을 기존 클래스에 추가하지 않으면서 시스템에 추가할 수 있다는 점이다. 
포장 대상 코드에 대한 기존 호출이 많을 경우 데코레이터 패턴이 효과적이다. 

### 포장 클래스 적용 순서 
1. 어느 부분의 코드를 변경해야 하는지 식별한다. 
2. 변경이 특정 위치에서 일련의 명령문으로 구현될 수 있다면, 포장 대상 클래스를 작성자의 인수로서 받는 클래스를 작성한다. 기존 클래스를 포장하는 클래스를 테스트 하네스 내에서 생성하기 어려울 경우 구현체 추출 혹은 인터페이스 추출 기법을 사용한다. 
3. 테스트 주도 개발 방법을 사용해서 포장 클래스에 새로운 처리를 수행하는 메소드를 작성한다. 또 메소드를 ㅎ나 개 더 작성한 후, 이 메소드에서 신규 메소드 및 포장된 클래스 내의 기존 메소드를 호출한다. 
4. 새로운 동작이 수행될 위치에서 포장 클래스의 인스턴스를 생성한다. 


### 포장 클래스 사용 조건
1. 추가하려는 동작이 완전히 독립적이며, 구현에 의존적인 동작이나 관련 없는 동작으로 기존 클래스를 오염시키고 싶지 않을 경우
2. 클래스가 비대해져서 더 이상 키우고 싶지 않은 경우, 이럴 경우 향후 의 변경을 대비하기 위한 목적으로만 클래스를 포장한다. 
 