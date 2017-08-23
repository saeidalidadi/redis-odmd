
For some use cases we need to have a `ODM` like structure in order to work with our
our stored hash data in `redis`. this module give us all the main methods for that but there
is't already any kind of `schemas` to define or `validations`.

```
npm install redis-odmd
```

## Example

```javascript
const Dictionary = require('redis-odmd');

const options = {
    prefix: 'online', // Prefix for your dictionary
    redis: {
        port: 6379
    }
}

// create your dictionary object
const online_users = Dictionary(options);

let data = {
      name: 'John',
      family: 'Doe',
      address: {
        country: 'Iran',
        city: 'Shiraz'
      }
    };

// Add data to your dictionary (store hash string)
online_users.set('123', data).then(result => {
  
  console.log(result) // OK

}).catch(err) {
  throw(err);
}
```
## options

Is an object which:

* `prefix` prefix of dictionary
* `keySeperator` for seperating `prefix` and `id` as `prefix<keySeperator>id`.
* `redis` all [redis options](https://www.npmjs.com/package/redis#options-object-properties)

## methods

* `set(id, data<Object|String>)` returns `OK` like redis.

* `get(id)` returns an dictionary object.

* `get(id, property)` returns the property from stored hash.
  
    ### Example

    ```javascript
    // stored hash
    const user = {
      name: 'John',
      family: 'Doe'
    }
    online_users.get(id, 'name').then(result => {
      console.log(result.data.name) // John 
    })
    ```

* `getAll()` returns an object contains all hashes with `key:hash`.

```javascript
online_users.getAll().then(users => {
  // all users
  /*
    {
      id_1: {
        name: 'John',
        family: 'Doe'
      },
      ...
    }
  */
})

```

* `delete(id)` redis return style.

* `exists(id)` redis return style.

* `count()` number of stored hashes in dictionary.

* `create(id, data<Object|String>)` returns an object of dictionary

* `update()` should be called after `get` and will `set` the hash with last changes. returns a promise.

    ### Example

    ```javascript
    online_users.get('123').then(user => {
      user.data.new_field = 'new_field';
      user.update()
    })
    ```



