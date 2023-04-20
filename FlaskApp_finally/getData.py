import simplejson as json
import requests
apiKey="9d55c6cd0e9961febb4a8d1430262600db3ddd3d"
Name="Dublin"
STATIONS="https://api.jcdecaux.com/vls/v1/stations"
r=requests.get(STATIONS, params={"apiKey":apiKey,"contract":Name})

r=json.loads(r.text)
print(r)

