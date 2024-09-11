

READ_CLIENT_ID=8fEXAMPLEd-90ac-4460-bd34-94EXAMPLE546
READ_CLIENT_SECRET=vnEXAMPLE0~ZysEXAMPLEWIZ-38EXAMPLEO6

POST_CLIENT_ID=d3EXAMPLE2d-8b1a-405e-a94f-260EXAMPLE3a
POST_CLIENT_SECRET=1ymEXAMPLESq5~H7pEXAMPLEcau

while true; do
  TOKEN_POST=$(
    node ../cli/cli.js -s http://localhost:9090 fetch-token \
        --clientID $POST_CLIENT_ID \
        --clientSecret $POST_CLIENT_SECRET \
        --scope post_echo | jq -r .access_token
  )
  echo POST $TOKEN_POST
  node ../cli/cli.js -s http://localhost:9090 --authToken $TOKEN_POST echo \
      --title 'Here I am JH' --body 'All is all'

  echo READ $TOKEN_READ
  TOKEN_READ=$(
    node ../cli/cli.js -s http://localhost:9090 fetch-token \
        --clientID $READ_CLIENT_ID \
        --clientSecret $READ_CLIENT_SECRET \
        --scope read_date | jq -r .access_token
  )
  node ../cli/cli.js -s http://localhost:9090 --authToken $TOKEN_READ get-date
done

