# micro-catalog

[![LoopBack](<https://github.com/strongloop/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png>)](http://loopback.io/)

## buscas com elastic search

```
POST /catalog/_search
{
  "query": {
    "bool": {
"must": [
        {
"match": {
            "docType": "Category"
          }
        }
      ]
    }
  }

}


POST /catalog/_search
{
  "size": 20,
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "id": "e6cc10e3-ca28-4783-a271-0f46525ac8cf"
          }
        }
      ]
    }
  }
}

GET /catalog/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "nested": {
            "path": "categories",
            "query": {
              "exists": { "field": "categories" }
            }
          }
        },
        {
          "nested": {
            "path": "categories",
            "query": {
              "term": { "categories.id": "2503f082-7e26-40df-85f2-7380a68cfdd0" }
            }
          }
        }
      ]
    }
  }
}

POST /catalog/_count
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "docType": "Category"
          }
        }
      ]
    }
  }
}
POST /catalog/_delete_by_query
{
  "query": {
    "match_all": {}
  }
}



GET /catalog/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "term": { "name": "balbinox" }
        }
      ]
    }
  }
}



POST /catalog/_update/27ad925c-5881-4701-a18f-dcb59ad54ef7
{
  "script": {
    "source": "ctx._source.is_active = false"
  }
}

POST /catalog/_search
{
  "query": {
    "query_string": {
      "default_field": "name",
      "query": "balbi*"
    }
  }
}

POST /catalog/_search
{
  "query": {
    "query_string": {
      "default_field": "name",
      "query": "(*grey*) OR (*silver*)"
    }
  }
}


POST /catalog/_search
{
  "query": {
    "match": {
      "name": {
        "query": "Selmer"
        , "fuzziness": "AUTO"
      }
    }
  }
}




POST /catalog/_search
{
  "query": {
    "fuzzy": {
      "name": {
        "value": "teste",
        "fuzziness": "AUTO"
      }
    }
  }
}

POST _analyze
{
   "text": "testebalbi"
}

POST /catalog/_open




PUT /catalog/_settings
{
  "indexSettings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "max_ngram_diff": 7,
    "analysis": {
      "analyzer": {
        "ngram_token_analyzer": {
          "type": "custom",
          "stopwords": "_none_",
          "filter": ["lowercase", "asciifolding", "no_stop", "ngram_filter"],
          "tokenizer": "whitespace"
        }
      },
      "filter": {
        "no_stop": {
          "type": "stop",
          "stopwords": "_none_"
        },
        "ngram_filter": {
          "type": "nGram",
          "min_gram": "2",
          "max_gram": "9"
        }
      }
    }
  }
}


POST /catalog/_search
{
"sort": [
   "_score", "name.keyword"
  ],
  "query": {
    "match": {
      "name": {
        "query": "Dark Almond"
        , "fuzziness": 0
      }
    }
  }
}
```
