'use strict';
const chai        = require('chai');
const Dictionary  = require('../index');
const redisClient = require('redis').createClient();
const expect      = chai.expect;
chai.should();

const options = {
  prefix: 'test',
  keySeperator: ':',
  redis: {
    port: 6379,
    host: '127.0.0.1'
  }
}

const dictionary = Dictionary(options);

const first_sample_data = {
  name: 'John',
  family: 'Doe',
  phone: '+98-933-9191848'
};

const first_sample_id  = '123';

const second_sample_data = {
  name: 'Saeid Alidadi',
  dob: '1989-06-12'
}

const second_sample_id = '321';

const has_method_as_promise = function (method) {
  expect(dictionary[method]).to.be.an.instanceof(Function);
  expect(dictionary[method]()).to.be.a('promise');
}

describe('Dictionary class', () => {

    beforeEach((done) => {
      redisClient.flushdb((err, succeeded) => {
        if (err) throw(err);
        done();
      })
    })

    // Dictionary.set(id, data) should set data for a id.
    /*
    it('should has a promise method as "set()"', () => {
      has_method_as_promise('set');
    })
    */
    it('should "set" a object data for a id.', (done) => {
        dictionary.set(first_sample_id, first_sample_data).then(result => {
            expect(result).to.equal('OK');
            dictionary.get(first_sample_id).then(result => {
              result.data.should.have.property('name', first_sample_data.name);
              done();
            })
        })
    })

    it('should "set" a value as string for an id', (done) => {
      dictionary.set('string_data', 'sample string').then(result => {
        expect(result).to.equal('OK');
        done();
      })
    })

    it('should set new values for cuurent stored hash', (done) => {
      dictionary.set(first_sample_id, first_sample_data).then(result => {
        dictionary.get(first_sample_id).then(result => {
          dictionary.set(first_sample_id, second_sample_data).then(result => {
            dictionary.get(first_sample_id).then(result => {
              result.data.name.should.be.equal(second_sample_data.name);
              result.data.dob.should.be.equal(second_sample_data.dob);
              done()
            })
          })
        })
      })
    })
    // Dictionary.get(id) should return a dictionary object with data for a id.
    it('Should has a promise method as get()', () => {
      has_method_as_promise('get');
    })

    it('should "return" data for a id.', (done) => {
        dictionary.set(first_sample_id, first_sample_data).then(result => {
            dictionary.get(first_sample_id).then(result => {
              result.data.should.have.property('name', first_sample_data.name);
              done();
            })
        })
    })

    it('should return "null" if id is not exist in cache.', (done) => {
        dictionary.get('random_id').then(result => {
            expect(result.data).to.equal(null);
            done();
        });
    });

    it('Should "get" a field of the hash in dictionary', (done) => {
      dictionary.set(first_sample_id, first_sample_data).then(result => {
        const keys = Object.keys(first_sample_data);
        const key = keys[0];
        dictionary.get(first_sample_id, key).then(result => {
          result.data[key].should.be.equal(first_sample_data[key]);
          done()
        })
      })
    })
    // dictionary.exists(id) should resolve "true" if the id exsist
    it('should has a promise method as "exsists()"', () => {
      has_method_as_promise('exists');
    })

    it('should resolve "1" if the id exsist else "0"', (done) => {
      dictionary.set(first_sample_id, first_sample_data).then((result) => {
        dictionary.exists(first_sample_id).then((result) => {
          expect(result).to.equal(1);
          dictionary.exists(second_sample_id).then(result => {
            expect(result).to.equal(0);
            done();
          })
        })
      })
    })

    // dictionary.delete(id) should resolve "true" if the id has been deleted
    it('should has a promise method as "delete()"', () => {
      has_method_as_promise('delete');
    })

    it('should resolve "1" if the id has been deleted', (done) => {
      dictionary.set(first_sample_id, first_sample_data).then((result) => {
        dictionary.delete(first_sample_id).then(result => {
          expect(result).to.be.equal(1);
          done();
        })
      })
    })

    it('shoud delete this hashed data from cache', (done) => {
      dictionary.set(first_sample_id, first_sample_data).then(result => {
        dictionary.get(first_sample_id).then(dic => {
          dic.delete().then(result => {
            result.should.be.equal(1);
            done();
          })
        })
      })
    })
    // dictionary.getAll() should return all data from cache for a dictionry
    it('should has a promise method as getAll()', () => {
      has_method_as_promise('getAll');
    })

    it('should return all data from cache for a dictionry', (done) => {
      dictionary.set(first_sample_id, first_sample_data).then(result =>{
        dictionary.set(second_sample_id, second_sample_data).then(result => {
          dictionary.getAll().then(result => {
            result.should.be.instanceof(Object);
            result[first_sample_id].should.be.instanceof(Object);
            result[first_sample_id].should.be.eql(first_sample_data);
            result[second_sample_id].should.be.eql(second_sample_data);
            done();
          })
        })
      })
    });

    it('shoud return "0" when there is not any cached for a dictionry.', (done) => {
      dictionary.getAll().then(result => {
        expect(result).to.be.equal(0);
        done();
      })
    })

    // dictionary.set(id, {prop: []}) should detect array properties and return as array for dictionary.get()
    it('should cache "array" property and return it as "array".', (done) => {
        let user_data = {
            ids: ['a', 'b', 'c']
        }
        const id = 'with_array';
        dictionary.set(id, user_data).then(result => {
            expect(result).to.equal('OK');
            dictionary.get(id).then(result => {
              expect(result.data.ids).to.eql(user_data.ids);
              result.data.ids.should.be.instanceof(Array);
              result.data.ids.should.have.lengthOf(3);
              done();
            })
        })
    })

    // Dictionary.create(id, data) shoud return this dictionary object for chaining
    it('Should "create" a dictionary for future use', () => {
      const dic = dictionary.create(first_sample_id, first_sample_data)
      dic.should.be.instanceOf(Object);
      dic.create.should.be.instanceOf(Function);
      dic.id.should.be.equal(first_sample_id);
    })

    // dictionary.update()
    it('shoud update the stored hash with new one', (done) => {
      dictionary.set(first_sample_id, first_sample_data).then(result => {
        dictionary.get(first_sample_id).then(dic => {
          dic.data.name = 'James';
          dic.update().then(result => {
            result.should.be.equal('OK');
            done();
          })
        })
      });
    })
    // for nested objects
    it('should "set" a nested object data for an id.', (done) => {
      options.hasNested = true;
      const nestedDictionary = Dictionary(options)
      first_sample_data.nested = {
        firstProp: 'thisIsAnested'
      };
      nestedDictionary.set(first_sample_id, first_sample_data).then(result => {
        expect(result).to.equal('OK');
        dictionary.get(first_sample_id).then(result => {
          result.data.should.have.property('name', first_sample_data.name);
          done();
        })
      })
    })
    // dictionary.getMapAll() should return all data for dictionry as Map()
    // dictionary.getAsMap(id) should return data for in id as map
})
