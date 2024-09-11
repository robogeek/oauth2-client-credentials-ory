

TOKEN_READ=ory_at_U6h8aSEDEXAMPLEzvf2LeL-Y
TOKEN_POST=ory_at_l9US7uRH1EXAMPLELO3lY07FFQc

while true; do
  node cli.js -s http://localhost:9090 --authToken $TOKEN_POST echo --title 'Here I am JH' --body 'All is all';
  node cli.js -s http://localhost:9090 --authToken $TOKEN_READ get-date;
done

