


client=$(docker exec -it hydra-hydra-1 hydra create oauth2-client \
  --endpoint "http://localhost:4445" \
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



# $ sh mkclient.sh write post_echo
# CLIENT ID=d383132d-8b1a-405e-a94f-260d5dc07b3a
# CLIENT SECRET=1ymwKKXRPJhGSq5~H7pAwBXcau

# $ sh mkclient.sh 'read' 'read_date'
# CLIENT ID=8f0e978d-90ac-4460-bd34-946d84fbb546
# CLIENT SECRET=vnlH0~ZysTaYIKt3WIZ-38CgO6
