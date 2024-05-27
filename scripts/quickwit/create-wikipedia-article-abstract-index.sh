#!/bin/sh

# notes:
# store_source is set to true so the actual documents will be kept

create_index_body=$(cat << EOF
{
  "version": "0.8",
  "index_id": "wikipedia-article-abstract",
  "doc_mapping": {
    "store_source": true,
    "field_mappings": [
      {
        "name": "id",
        "type": "u64",
        "fast": true
      },
      {
        "name": "title",
        "type": "text",
        "tokenizer": "default",
        "record": "position"
      },
      {
        "name": "abstract",
        "type": "text",
        "tokenizer": "default",
        "record": "position"
      },
      {
        "name": "url",
        "type": "text",
        "tokenizer": "lowercase",
        "record": "basic",
        "fast": true
      }
    ]
  },
  "search_settings": {
    "default_search_fields": [
      "title",
      "abstract",
      "url"
    ]
  }
}
EOF
)

# we set overwrite to false so this will result with an error
# if the articles index already exists
curl -X 'POST' \
  'http://127.0.0.1:7280/api/v1/indexes?overwrite=false' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d "$create_index_body"
