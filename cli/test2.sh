

READ_CLIENT_ID=23EXAMPLE6-4835-4316-8b6a-59EXAMPLE465
READ_CLIENT_SECRET=7bEXAMPLEIH~ZKEXAMPLE6y~LpEXAMPLEX3

POST_CLIENT_ID=67EXAMPLE5c-506a-47f3-a57d-082EXAMPLEc1f
POST_CLIENT_SECRET=0dEXAMPLEF.QU~f83EXAMPLE8TB

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

