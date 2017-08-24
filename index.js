'use strict';

const Redis = require('redis');
const Flat = require('flat');

// Private methods
const internals = {}

class Dictionary {
  constructor(options)
  {
    this.PREFIX = options.prefix || 'dictionary';
    this.SEPERATOR = options.keySeperator || ':';
    this.arrayProps = [];
    this.data = {};
    this.type = 'Object';
    this.client = internals.client;
    this.id = '';
    this.hasNested = options.hasNested || false;
  }

  /**
   * Set a value for given key to cache
   * @param   {String} data
   * @param   {Object} data
   * @param   {String} object_id
   * @returns {Promise.<OK>} returns OK for successfull action
   */
  set(id, data)
  {
    this.id = id || this.id;
    const key = this.key(id);
    this.type = data instanceof Object ? 'Object' : (data instanceof Array ? 'Array' : 'String');
    data = Flat.flatten(data);
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
  get(id, property) {
    this.id = id;
    const key = this.key(id);
    return new Promise((resolve, reject) => {
      if(!property) {
        return this.client.hgetall(key, (err, result) => {
          if(err) {
            return reject(err);
          }
          //internals.convert_to_array.call(this, result);

          this.data = Flat.unflatten(result);
          resolve(this);
        });
      }
      this.client.hget(key, property, (err, result) => {
        if(err) {
          return reject(err);
        }
        this.data ? this.data[property] = result : this.data = { [property]: result};
        this.data = Flat.unflatten(this.data);
        resolve(this);
      });
    });
  }

  getAll()
  {
    const key = this.key();
    const data = {};

    return new Promise((resolve, reject) => {
      this.client.keys(`${this.PREFIX}${this.SEPERATOR}*`, (err, keys) => {

        if(err) return reject(err);

        if(!keys.length) return resolve(0);

        for(let i in keys) {

          ((i) => {

            this.client.hgetall(keys[i], (err, result) => {
              if(err) return reject(err);
              const id = internals.trim_prefix.call(this, keys[i]);
              data[id] = Flat.unflatten(result);
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
    let key = object_id ? this.key(object_id) : this.key();
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

  exists(id, property)
  {
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

  create(id, data)
  {
    this.data = data;
    this.id = id;
    return this;
  }

  save()
  {
    return this.set(this.id, this.data);
  }

  update()
  {
    return this.set(this.id, this.data);
  }

  toArray (property)
  {
    return property.split(',');
  }

  key(id)
  {
    id = id || this.id;
    return `${this.PREFIX}${this.SEPERATOR}${id}`;
  }
}

/*
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
*/

internals.trim_prefix = function(key) {
  return key.split(this.SEPERATOR)[1];
}

module.exports = function(options) {
  internals.client = Redis.createClient(options.redis || {});
  return new Dictionary(options);
}
