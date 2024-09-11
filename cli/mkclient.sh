
. ./env.sh

client=$(ory create oauth2-client \
  --endpoint "${ORY_NET_API_ENDPOINT}" \
  --project "${ORY_NET_PROJECT_ID}" \
  --name "$1" \
  --grant-type client_credentials \
  --scope "$2" \
  --token-endpoint-auth-method client_secret_post \
  --format json 
  # --token-endpoint-auth-method private_key_jwt \
  # --jwks-uri https://example.org/path/to/clients/public_key_set.jwks
  )


echo CLIENT ID=$(echo $client | jq -r '.client_id')
echo CLIENT SECRET=$(echo $client | jq -r '.client_secret')

echo $client | jq --indent 4
