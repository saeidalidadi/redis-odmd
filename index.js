const Redis = require('redis'); 

// Private methods
const internals = {}

class Dictionary {
  constructor(options={})
  {
    this.PREFIX = options.prefix || 'dictionary';
    this.SEPERATOR = options.keySeperator || ':';
    this.arrayProps = [];
    this.data = {};
    this.type = 'Object';
    this.arraySeperator = options.arraySeperator || ',';
    this.client = internals.client;
  }

  /**
   * Set a value for given key to cache
   * @param   {String} data
   * @param   {Object} data
   * @param   {String} object_id
   * @returns {Promise.<OK>} returns OK for successfull action
   */
  set(object_id, data)
  {
    const key = this.key(object_id);
    this.type = data instanceof Object ? 'Object' : (data instanceof Array ? 'Array' : 'String');
    internals.find_arrays.call(this, data);
    internals.join_arrays.call(this, data);
    return new Promise((resolve, reject) => {
      if(data instanceof Object) {
        return this.client.hmset(key, data, function(err, result) {
          if (err) {
            return reject(err);
          }
          resolve(result);
        })
      }
      this.client.set(key, data, function(err, result) {
        if(err) {
          return reject(err);
        }
        resolve(result);
      })
    })
  }

  /**
   * @returns {Promise.<Object|Array>} cached data
   */
  get(data_id, property) {
    const key = this.key(data_id);

    return new Promise((resolve, reject) => {
      if(!property) {
        return this.client.hgetall(key, (err, result) => {
          if(err) {
            return reject(err);
          }
          internals.convert_to_array.call(this, result);
          resolve(result);
        });
      }
      this.client.hget(key, property, (err, result) => {
        if(err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  getAll() {
    
    const key = this.key();
    const data = {};
    
    return new Promise((resolve, reject) => {
      
      this.client.keys(`${key}*`, (err, keys) => {
        
        if(err) return reject(err);
        
        if(!keys.length) return resolve(0);
        
        for(let i in keys) {
          
          ((i) => {
            
            this.client.hgetall(keys[i], (err, result) => {
              if(err) return reject(err);
              const id = internals.trim_prefix.call(this, keys[i]);
              data[id] = result;
              (i == keys.length -1) ? resolve(data) : void(0); 
            })
          })(i);
        }
      })
    })
  }

  /**
   * @returns {Promise.<Number>} number of values
   */
  count() 
  {
    return new Promise((resolve, reject) => {
      this.client.keys(`${this.key()}*`, (err, result) => {
          if (err) return reject(err);
          resolve(result.length);
        });
    });
  }

  delete(object_id, property)
  {
    let key = this.key(object_id);
    return new Promise((resolve, reject) => {
      if(!property) {
        return this.client.del(key, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      }
      this.client.hdel(key, property, (err, result) => {
        if(err) return reject(err);
        resolve(result);
      })
    });
  }

  exists(id, property) {
    const key = this.key(id);
    return new Promise((resolve, reject) => {
      if(!property) {
        return this.client.exists(this.key(id), (err, result) => {
          if(err) {
            return reject(err);
          }
          resolve(result)
        })
      }
      this.client.hexists(key, property, (err, result) => {
        if(err) return reject(err);
        resolve(result);
      })
    })
  }

  toArray (property) {
    return property.split(',');
  }

  key(id) {
    return `${this.PREFIX}${this.SEPERATOR}${id || ''}`;
  }
}


internals.find_arrays = function(data) {
  if(data instanceof Object) {
    for(let key in data) {
      data[key] instanceof Array ? this.arrayProps.push(key) : void(0);
    }
  }
}

internals.convert_to_array = function(data) {
  if(data instanceof Object) {
    for(let key in data) {
      if(-1 < this.arrayProps.indexOf(key)) {
        const temp = data[key].slice(0);

        data[key] = temp.split(this.arraySeperator).slice(0);
      }
    }
  }
}

internals.join_arrays = function(data) {
  for(let key in data) {
    if(data[key] instanceof Array) {
      data[key] = data[key].join(this.arraySeperator);
    }
  }
}

internals.trim_prefix = function(key) {
  return key.split(this.SEPERATOR)[1];
}

module.exports = function(options={}) {
  internals.client = Redis.createClient(options.redis || {});
  return new Dictionary(options);
}