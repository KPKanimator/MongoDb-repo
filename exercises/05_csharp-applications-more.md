# Установка драйвера и подключение к базе данных
Фреймворк .NET и в частности язык C# благодаря наличию драйвера также могут работать с MongoDB. Исходные файлы драйвера, а также разную необходимую информацию, например, что добавлено в новой версии, какие были сделаны улучшения и т.д., все это можно найти на странице на гитхабе: https://github.com/mongodb/mongo-csharp-driver/releases. Оттуда можно загрузить исходный код драйвера, либо его бинарные файлы.
Но для установки всех необходимых файлов и библиотек драйвера в проект проще использовать пакетный менеджер NuGet:
  
Текущей версией драйвера является версия 2.4. Версию следует учитывать при работе, так как функционал отдельных версий может отличаться.
Итак, возьмем простой консольный проект на C# и через NuGet установим в него пакет драйвера MongoDB.
И после этого в проект будет добавлен ряд библиотек: MongoDB.BSON.dll, MongoDB.Driver и MongoDB.Driver.Core:
  
Библиотека MongoDB.BSON.dll содержит код документы и значения BSON, а также код для сопоставления документов BSON с объектами классов на C#.
Библиотека MongoDB.Driver.Core.dll содержит функционал для подключения к серверу.
Библиотека MongoDB.Driver.dll представляет легковесную обертку для взаимодействия кода на C# с сервером MongoDB.
Затем в коде программы мы можем подключить все необходимые пространства имен:
```using MongoDB.Bson;
using MongoDB.Driver;
```
## Подключение к базе данных
Для подключения к базе данных необходимо использовать ряд классов:
      string connectionString = "mongodb://localhost:27017"; // адрес сервера
      MongoClient client = new MongoClient(connectionString);
      IMongoDatabase database = client.GetDatabase("test");
Для установки подключения первым делом нам надо использовать класс MongoClient, в конструктор которого надо передать строку подключения:
      string connectionString = "mongodb://localhost:27017"; // адрес сервера
      MongoClient client = new MongoClient(connectionString);
Строка подключения имеет следующий вид: mongodb://[username:password@]hostname[:port][/[database][?options]]. Например, при указании всех параметров строка подключения могла бы выглядеть так: mongodb://user:pass@localhost/db1?authSource=userDb - в данном случае пользователь с логином user и паролем pass подключается к базе данных db1 на хосте localhost. Кроме того, также задается дополнительный параметр authSource со значением userDb.
Если порт не указан, то по умолчанию используется порт 27017.
После получения клиента с его помощью мы можем уже непосредственно обращаться к конкретным базам данных. Для получения базы данных применяется метод GetDatabase, в который передается название базы. Этот метод возвращает объект IMongoDatabase:
      IMongoDatabase database = client.GetDatabase("test");
В данном случае идет получение ссылки на базу данных test, которая имеется в пакете mongodb по умолчанию. Получив объект базы данных, мы можем обращаться к конкретным коллекциям и проводить различные операции с данными.
После выполнения всех необходимых операций нам необязательно закрывать подключение, как, например, в случае с подключениями к другим базам данных, так как MongoDB сама выполнит всю работу.

# Строки подключения в файлах конфигураций
Кроме жесткого кодирования строк подключения в коде можно также их определить в конфигурационных файлах: app.config (для десктопных приложений) и web.config (для веб-приложений) в секции connectionString:
```  <connectionStrings>
    <add name="MongoDb" connectionString="mongodb://localhost/lab6db" />
  </connectionStrings>
```
Атрибут connectionString устанавливает параметры подключения, в частности сервер - тот же localhost и название базы данных - lab6db.
Тогда на стороне сервера получение строки подключения из файла будет выглядеть так:
```
using System;
using System.Configuration;
using System.Threading.Tasks;
using MongoDB.Driver;


namespace Lab6
{
  class Program
  {
    static void Main(string[] args)
    {
      //string connectionString = "mongodb://localhost:27017"; // адрес сервера
      //MongoClient client = new MongoClient(connectionString);
      string connectionString = ConfigurationManager.ConnectionStrings["MongoDb"].ConnectionString;
      var client = new MongoClient(connectionString);
```
Для использования класса ConfigurationManager необходимо добавить в проект библиотеку System.Configuration.dll:
 
 Получение всех бд с сервера
Создадим небольшое консольное приложение, которое будет выводить на экран все базы данных сервера:
```
using System;
using System.Configuration;
using System.Threading.Tasks;
using MongoDB.Driver;


namespace Lab6
{
  class Program
  {
    static void Main(string[] args)
    {
      string connectionString = ConfigurationManager.ConnectionStrings["MongoDb"].ConnectionString;
      var client = new MongoClient(connectionString);

      IMongoDatabase database = client.GetDatabase("test");
      GetDatabaseNames(client).GetAwaiter();
      Console.ReadKey();
    }
    private static async Task GetDatabaseNames(MongoClient client)
    {
      using (var cursor = await client.ListDatabasesAsync())
      {
        var databaseDocuments = await cursor.ToListAsync();
        foreach (var databaseDocument in databaseDocuments)
        {
          Console.WriteLine(databaseDocument["name"]);
        }
      }
    }

  }
}
```
В этом случае в файле App.config должно быть прописано определение строки подключения:
```
<?xml version="1.0" encoding="utf-8" ?>
<configuration>
  <startup>
    <supportedRuntime version="v4.0" sku=".NETFramework,Version=v4.7.2" />
  </startup>
  <connectionStrings>
    <add name="MongoDb" connectionString="mongodb://localhost/lab6db" />
  </connectionStrings>
</configuration>
```
## Взаимодействие с коллекцией. Документы
Подобно тому, как в обычных реляционных СУБД мы проходим несколько уровней при взаимодействии с сервером базы данных (сервер БД - > база данных -> таблица), так и при взаимодействии с MongoDB мы также проходим несколько уровней:
  
Ранее мы рассмотрели получение ссылки на базу данных с помощью объекта IMongoDatabase. Данные в базе данных хранятся в коллекциях, которые представлены объектом IMongoCollection. Например, получим все коллекции всех баз данных, которые имеются на сервере:

```
private static async Task GetCollectionsNamesAsync(MongoClient client)
    {
      using (var cursor = await client.ListDatabasesAsync())
      {
        var dbs = await cursor.ToListAsync();
        foreach (var db in dbs)
        {
          Console.WriteLine("В базе данных {0} имеются следующие коллекции:", db["name"]);

          IMongoDatabase database = client.GetDatabase(db["name"].ToString());

          using (var collCursor = await database.ListCollectionsAsync())
          {
            var colls = await collCursor.ToListAsync();
            foreach (var col in colls)
            {
              Console.WriteLine(col["name"]);
            }
          }
          Console.WriteLine();
        }
      }
    }
```
На скриншоте видно, что у меня есть база данных test, в которой имеется коллекция users. И чтобы непосредственно получить эту коллекцию, можно использовать метод GetCollection, который возвращает объект IMongoCollection:
```
MongoClient client = new MongoClient(connectionString);
IMongoDatabase database = client.GetDatabase("test");
IMongoCollection<BsonDocument> col = database.GetCollection<BsonDocument>("users");
```
Каждый объект IMongoCollection типизирован типом BsonDocument, который представляет собой документ. А саму коллекцию можно представлять как набор документов BsonDocument.
### BsonDocument
Так как MongoDB представляет документо-ориентированные базы данных, то все данные в ней хранятся в виде документов. Таким образом, база данных состоит из коллекций, а коллекции - из документов. Каждый документ представляет набор пар элементов ключ-значение наподобие словаря и представлен классом BsonDocument из пространства имен MongoDB.BSON.
Набор данных в документе находится в формате bson, который близок к формату json. Например, стандартный документ:
```
{
    "name": "Bill",
    "surname": "Gates",
    "age": "48",
    "company": {
        "name" : "microsoft",
        "year" : "1974",
        "price" : "300000"
        }
}
```
Каждая пара ключ-значение, то есть отдельный элемент в документе, например, "name": "Bill", представляет класс BsonElement, а каждое отдельное значение (в данном случае строка "Bill") - класс BsonValue
Хотя на самом деле напрямую работа будет вестись через классы-наследники BsonValue: BsonDouble, BsonString, BsonInt32, BsonBoolean и ряд других.
## Операции преобразования типов
Класс BsonValue содержит ряд свойств, которые позволяют преобразовать тип его значения в один из типов C#. Все эти свойства образованы по шаблону As[Тип]. Некоторые из них:
•	AsByteArray: преобразует тип в массив байтов byte[]
•	AsDateTime: преобразует элемент в объект DateTime
•	AsDouble: преобразует элемент в объект Double
•	AsGuid: преобразует элемент в объект Guid
•	AsInt32: преобразует элемент в объект int
•	AsInt64: преобразует элемент в объект long
•	AsString: преобразует элемент в объект string
•	AsObjectId: преобразует элемент в объект ObjectId
Например, совершим переход от BsonInt32 к стандартному типу int:
```
BsonValue bv = new BsonInt32(20);
int i = bv.AsInt32;
```
В то же время не всегда можно провести преобразования, как например, в следующем случае:
```
BsonValue bv = new BsonInt32(20);
ObjectId ob = bv.AsObjectId;
```
В этом случае среда сгенерирует исключение типа InvalidCastException.
Перед приведением можно использовать одно из свойств, показывающее, можно ли преобразовать тип объекта в другой тип. Подобные свойства образованы по шаблону Is[Тип] и в случае возможности преобразования типа объекта к типу [Тип], возвращают значение true. Некоторые из этих свойств:
•	IsDateTime: возвращает true, если элемент представляет тип DateTime
•	IsDouble: возвращает true, если элемент представляет тип Double
•	IsGuid: возвращает true, если элемент представляет тип Guid
•	IsInt32: возвращает true, если элемент представляет тип int
•	IsInt64: возвращает true, если элемент представляет тип long
•	IsString: возвращает true, если элемент представляет тип string
•	IsObjectId: возвращает true, если элемент представляет тип ObjectId
Например:
```
BsonValue bv = new BsonInt32(20);
int i=-1;
if(bv.IsInt32)
    i = bv.AsInt32;
 
ObjectId ob = new ObjectId();
if (bv.IsObjectId)
    ob= bv.AsObjectId;
```
### Создание документа
Для создания документа мы можем использовать одну из форм конструктора BsonDocument. Например, создадим пустой документ:
```
sonDocument doc = new BsonDocument();
Console.WriteLine(doc);
```
При выводе на консоль мы получим следующее:
```
{ }
```
Теперь создадим документ с одним элементом:
```
BsonDocument doc = new BsonDocument { {"name","Bill"}};
Console.WriteLine(doc);
```
И консоль отобразит следующее:
```{ "name" : "Bill"}```
Теперь выведем на консоль значение поля name:
```BsonDocument doc = new BsonDocument { { "name", "Bill" } };
 
Console.WriteLine(doc["name"]);
// изменим поле name
doc["name"] = "Tom";
 ```
Console.WriteLine(doc.GetValue("name"));
Использованные в данном случае способы вывода поля: doc["name"] и doc.GetValue("name") будут равнозначными.
Так как каждая такая пара ключ-значение представляет элемент BsonElement, то мы могли бы написать и так:
```	
BsonElement bel = new BsonElement("name","Bill");
BsonDocument doc = new BsonDocument(bel);
Console.WriteLine(doc);
```
Или использовать метод Add для добавления нового элемента:
```
BsonElement bel = new BsonElement("name","Bill");
BsonDocument doc = new BsonDocument();
doc.Add(bel);
Console.WriteLine(doc);
```
Теперь создадим более сложный по составу элемент:
```      
BsonDocument doc = new BsonDocument
      {
          {"name","Bill"},
          {"surname", "Gates"},
          {"age", new BsonInt32(48)},
          { "company",
              new BsonDocument{
                  {"name" , "microsoft"},
                  {"year", new BsonInt32(1974)},
                  {"price", new BsonInt32(300000)},
              }
          }
      };
      Console.WriteLine(doc);
```
И консоль отобразит следующее:
```{
    "name": "Bill",
    "surname": "Gates",
    "age": 48,
    "company": {
        "name" : "microsoft",
        "year" : 1974,
        "price" : 300000
        }
}
```
И еще пример - добавим в документ массив:
```	
BsonDocument chemp = new BsonDocument();
chemp.Add("countries", new BsonArray(new[] { "Бразилия", "Аргентина", "Германия", "Нидерланды" }));
chemp.Add("finished", new BsonBoolean(true));
Console.WriteLine(chemp);
Консольный вывод:
{
    "countries": ["Бразилия", "Аргентина", "Германия", "Нидерланды"],
    "finished": true
}
```

## Модели данных
Хотя создание документов можно осуществлять с помощью класса BsonDocument, но намного было бы проще работать напрямую через классы, которые представляют данные. И драйвер MongoDB для C# предоставляет эту возможность. Например, создадим модель данных:
```
using MongoDB.Bson;
using System.Collections.Generic;
 
namespace MongoDBApp
{
    class Person
    {
        public ObjectId Id { get; set; }
        public string Name { get; set; }
        public string Surname { get; set; }
        public int Age { get; set; }
        public Company Company { get; set; }
        public List<string> Languages { get; set; }
    }
    class Company
    {
        public string Name { get; set; }
    }
}
```
Здесь определен класс Person, который представляет человека, и класс Company, который представляет компанию, где работает человек.
Стоит обратить внимание, что в качестве свойства-идентификатора Id в классе Person используется объект класса ObjectId, который определен в библиотеке MongoDB.Bson.dll.
Пространство имен MongoDB.Bson добавляет ряд функциональностей к классам C#, которые позволяют использовать объекты этих классов в качестве документов:
```
using System;
using MongoDB.Bson;
 
namespace MongoDBApp
{
    class Program
    {
        static void Main(string[] args)
        {
            Person p = new Person { Name = "Bill", Surname = "Gates", Age = 48 };
            p.Company = new Company { Name = "Microsoft"};
 
            Console.WriteLine(p.ToJson());
            Console.ReadLine();
        }
    }
}
```
Библиотека MongoDB.Bson.dll добавляет ряд методов к классам, в частности метод ToJson, который преобразует объект в формат JSON, а сам объект представляет документ.
При создании документа мы можем воспользоваться как стандартным классом C#, так и классом BsonDocument, и при необходимости перейти от одного к другому. Например:
```using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
 
namespace MongoDBApp
{
    class Program
    {
        static void Main(string[] args)
        {
            BsonDocument doc = new BsonDocument
            {
                {"Name","Bill"},
                {"Surname", "Gates"},
                {"Age", new BsonInt32(48)},
                { "Company",
                    new BsonDocument{
                        {"Name" , "Microsoft"}
                    }
                }
            };
            Person p = BsonSerializer.Deserialize<Person>(doc);
            Console.WriteLine(p.ToJson());
             
            Console.ReadLine();
        }
    }
}
```
С помощью метода Deserialize() класса BsonSerializer из пространства имен MongoDB.Bson.Serialization мы можем выполнить десериализацию из документа в объект модели Person. При этом важно, чтобы имена свойств модели совпадали с именами элементов в документе (в том числе и по регистру), иначе программе не удастся сопоставить элементы и свойства.
Также можно выполнить обратную операцию по преобразованию объекта в BsonDocument:
```
Person p = new Person { Name = "Bill", Surname = "Gates", Age = 48 };
p.Company = new Company { Name = "Microsoft"};
BsonDocument doc = p.ToBsonDocument();
Console.WriteLine(doc);
```
## Настройка модели с помощью атрибутов
### Установка Id
Каждый объект в базе данных имеет поле _id, которое выполняет роль уникального идентификатора объекта. Используя атрибут BsonId мы можем явно установить свойство, которое будет выполнять роль идентификатора:
```
class Person
{
    [BsonId]
    public int PersonId { get; set; }
    public string Name { get; set; }
}
```
Хотя в данном случае свойство называется PersonId и имеет тип int, при создании документа данное свойство будет представлять в документе поле _id
Используя атрибуты, мы можем управлять настройкой классов моделей и их сериализацией в документы mongodb. Например:
```using MongoDB.Bson.Serialization.Attributes;
........................................
class Person
{
    [BsonElement("First Name")]
    public string Name { get; set; }
    [BsonIgnore]
    public string Surname { get; set; }
    public int Age { get; set; }
    public Company Company {get;set;}
}
class Company
{
    public string Name { get; set; }
}
```
Атрибут BsonIgnore позволяет не учитывать свойство Surname при сериализации объекта в документ. А атрибут BsonElement позволяет задать настройки элемента для данного свойства. В частности, здесь изменяется название элемента с Name на First Name. Поэтому при создании документа:
```Person p = new Person { Name = "Bill", Surname = "Gates", Age = 48 };
p.Company = new Company { Name = "Microsoft"};
             
Console.WriteLine(p.ToJson());
```
Мы получим следующий вывод:
```{
    "First Name": "Bill",
    "Age": 48,
    "Company": {
        "Name" : "Microsoft"
        }
}
```
### Игнорирование значений по умолчанию
В примере выше для объекта Person задается объект Company. Однако в какой-то ситуации для объекта Person данный объект может отсутствовать. Например, человек не работает ни в какой компании. Однако даже если мы не укажем компанию, такой документ все равно будет содержать данный элемент, только у него будет значение null. Чтобы избежать добавление в документ элементов, которые имеют значения, можно использовать атрибут BsonIgnoreIfNull:
```class Person
{
    public string Name { get; set; }
    public string Surname { get; set; }
    [BsonIgnoreIfDefault]
    public int Age { get; set; }
    [BsonIgnoreIfNull]
    public Company Company {get;set;}
}
```
В этом случае объект:
1	Person p = new Person { Name = "Bill", Surname = "Gates", Age = 48 };
будет представлять следующий документ:
```{
    "Name": "Bill",
    "Surname": "Gates",
    "Age": 48
}
```
Так как данный атрибут работает только для свойств, которые могут иметь значение null, то есть ссылочных типов, то он не подходит для объектов значимых типов. Например, нам неизвестен возраст человека: Person p = new Person { Name = "Bill", Surname = "Gates"};. Но даже если мы не указали свойство Age, оно будет присутствовать в документе со значением 0 - то есть значением по умолчанию. Чтобы этого избежать, для свойства Age использован атрибут BsonIgnoreIfDefault.
### BsonRepresentation
Еще один атрибут BsonRepresentation отвечает за представление свойства в базе данных. Например:
```
class Person
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }
    public string Name { get; set; }
    [BsonRepresentation(BsonType.String)]
    public int Age { get; set; }
}
```
В этом случае для свойства Id указывается, что оно будет выполнять роль идентификатора и в базе данных соответствующее поле будет иметь тип ObjectId. А вот свойству целочисленному Age в базе данных будет соответствовать строковое поле Age из-за применения атрибута [BsonRepresentation(BsonType.String)].
BsonClassMap
Для настройки сопоставления классов C# с коллекциями MongoDB можно использовать класс BsonClassMap, который регистрирует принципы сопоставления. Например, возьмем тот же класс Person:
```static void Main(string[] args)
{
    BsonClassMap.RegisterClassMap<Person>(cm =>
    {
        cm.AutoMap();
        cm.MapMember(p => p.Name).SetElementName("name");
    });
    Person person = new Person { Name = "Bill", Age = 48 };
    BsonDocument doc = person.ToBsonDocument();
    Console.WriteLine(doc);
 
    Console.ReadLine();
}
```
С помощью метода RegisterClassMap() определяется карта сопоставления объектов Person и BsonDocument. В частности, в данном случае для свойство Name будет сопоставляться с полем name.
### Конвенции
Конвенции наряду с атрибутами и BsonClassMap представляют еще один способ определения сопоставления классов и объектов BsonDocument. Конвенции определяются в виде набора - объекта ConventionPack. Этот объект может содержать набор конвенций. Каждая конвенция представляет объект класса, производного от ConventionBase. Например, переведем все ключи в BsonDocument в нижний регистр:
```
using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Conventions;
 
namespace MongoDBApp
{
    class Program
    {
        static void Main(string[] args)
        {
            var conventionPack = new ConventionPack();
            conventionPack.Add(new CamelCaseElementNameConvention());
            ConventionRegistry.Register("camelCase", conventionPack, t => true);
            Person person = new Person { Name = "Bill", Age = 48 };
             
            BsonDocument doc = person.ToBsonDocument();
            Console.WriteLine(doc);
 
            Console.ReadLine();
        }
    }
}
```
В данном случае применяется конвенция CamelCaseElementNameConvention, которая переводит названия свойства в camel case - имена начинаются со строчной буквы.
Конвенция добавляется с помощью метода Add() класса ConventionPack. И чтобы она сработала, необходимо вызвать метод ConventionRegistry.Register(), который зарегистрирует конвенцию. Первый параметр метода представляет название конвенции, второй - объект ConventionPack, а третий - условие, при котором применяется конвенция. Здесь в качестве условия просто установлено ключевое слово true, то есть конвенция будет применяться ко всем свойствам.
В результате при выводе на консоль названия всех ключей в документе будут переведены в нижний регистр:
```{"_id" : null, "name" : "Bill", "age" : 48}```

## Сохранение документов в базу данных

Для добавления данных в коллекцию используется метод InsertOneAsync, определенный в интерфейсе IMongoCollection. Например, добавим в коллекцию people один документ:
```using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
 
namespace MongoDBApp
{
    class Program
    {
        static void Main(string[] args)
        {
            SaveDocs().GetAwaiter().GetResult();
          
            Console.ReadLine();
        }
 
        private static async Task SaveDocs()
        {
            string connectionString = "mongodb://localhost";
            var client = new MongoClient(connectionString);
            var database = client.GetDatabase("test");
            var collection = database.GetCollection<BsonDocument>("people");
            BsonDocument person1 = new BsonDocument 
            {
                {"Name", "Bill"},
                {"Age", 32},
                {"Languages", new BsonArray{"english", "german"}}
            };
            await collection.InsertOneAsync(person1);
        }
    }
}
```
Кроме метода InsertOneAsync мы также можем использовать для сохранения документов метод InsertManyAsync(), который в качестве параметра принимает набор объектов:
```private static async Task SaveDocs()
{
    string connectionString = "mongodb://localhost";
    var client = new MongoClient(connectionString);
    var database = client.GetDatabase("test");
    var collection = database.GetCollection<BsonDocument>("people");
    BsonDocument person1 = new BsonDocument 
    {
        {"Name", "Bill"},
        {"Age", 32},
        {"Languages", new BsonArray{"english", "german"}}
    };
    BsonDocument person2 = new BsonDocument 
    {
        {"Name", "Steve"},
        {"Age", 31},
        {"Languages", new BsonArray{"english", "french"}}
    };
    await collection.InsertManyAsync(new []{person1,person2});
}
```
Однако мы можем работать не только с объектами BsonDocument, но и со стандартными классами C#. Допустим, нам надо сохранить объекты следующих классов:
```using MongoDB.Bson;
using System.Collections.Generic;
 
namespace MongoDBApp
{
    class Person
    {
        public ObjectId Id { get; set; }
        public string Name { get; set; }
        public int Age { get; set; }
        public Company Company { get; set; }
        public List<string> Languages { get; set; }
    }
    class Company
    {
        public string Name { get; set; }
    }
}
```
Теперь добавим объект Person в коллекцию people:

```private static async Task SaveDocs()
{
    string connectionString = "mongodb://localhost";
    var client = new MongoClient(connectionString);
    var database = client.GetDatabase("test");
    var collection = database.GetCollection<Person>("people");
    Person person1 = new Person 
    {
        Name="Jack",
        Age = 29,
        Languages = new List<string>{"english", "german"},
        Company = new Company
        {
            Name="Google"
        }
    };
    await collection.InsertOneAsync(person1);
}
```
Так как коллекция будет хранить данные типа Person, то она типизируется данным типом: MongoCollection<Person>. В данном случае объекты Person будут выступать в роли документов.
При добавлении, если для объекта не установлен идентификатор "_id", то он автоматически генерируется. И затем мы его можем получить:
```await collection.InsertOneAsync(person1);
Console.WriteLine(person1.Id);
```

