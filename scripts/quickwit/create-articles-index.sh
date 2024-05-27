#!/bin/sh

# notes:
# store_source is set to true so the actual documents will be kept

create_index_body=$(cat << EOF
{
  "version": "0.8",
  "index_id": "articles",
  "doc_mapping": {
    "store_source": true,
    "field_mappings": [
      {
        "name": "id",
        "type": "u64",
        "fast": true
      },
      {
        "name": "created_at",
        "type": "datetime",
        "input_formats": [
          "unix_timestamp"
        ],
        "output_format": "unix_timestamp_secs",
        "fast_precision": "seconds",
        "fast": true
      },
      {
        "name": "title",
        "type": "text",
        "tokenizer": "default",
        "record": "position"
      },
      {
        "name": "body",
        "type": "text",
        "tokenizer": "default",
        "record": "position"
      }
    ],
    "timestamp_field": "created_at"
  },
  "search_settings": {
    "default_search_fields": [
      "title",
      "body"
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
