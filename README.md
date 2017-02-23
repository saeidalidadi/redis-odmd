

```
npm install shahcache
```

## Example

```javascript
const shahcache = require('shahcache');

const options = {
    prefix: 'online', // Prefix for your dictionary
    redis: {
        port: 6378
    }
}

// create your dictionary object
const online_users = shahcache(options);

let data = {
      name: 'Mohammadreza',
      family: 'Pahlavi'
    }

// Add data to your dictionary (store hash string)
online_users.set('123', data).then(result => {
  
  console.log(result) // OK

}).catch(err) {
  throw(err);
}
```
## options

Is an object which:

* `.prefix` prefix of dictionary
* `.keySeperator` for seperating `prefix` and `id` as `prefix<keySeperator>id`.
* `.arraySeperator` `default: ,` for seperating array items.
* `.redis` all [redis options](https://www.npmjs.com/package/redis#options-object-properties)

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
    user_dictionary.get(id, 'name').then(result => {
      console.log(result.data.name) // John 
    })
    ```

* `getAll()` returns an object with `id`'s as keys.

* `delete(id)` redis return style.

* `exists(id)` redis return style.

* `count()` number of stored hashes in dictionary.

* `create(id, data<Object|String>)` returns an object of dictionary

* `update()` should be called after `get` and will `set` the hash with last changes. returns a promise.

    ### Example

    ```javascript
    dictionary.get('123').then(dic => {
      dic.data.new_field = 'new_field';
      dic.update()
    })
    ```



