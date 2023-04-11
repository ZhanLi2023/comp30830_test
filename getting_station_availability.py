import requests
import json
import requests
import json
import sqlalchemy as sqla
from sqlalchemy import create_engine
import traceback
import glob
import os
from pprint import pprint
import simplejson as json
import requests
import time
import datetime
# connect to api
apiKey="9d55c6cd0e9961febb4a8d1430262600db3ddd3d"
Name="Dublin"
STATIONS="https://api.jcdecaux.com/vls/v1/stations"
r=requests.get(STATIONS,params={"apiKey":apiKey,"contract":Name})
json.loads(r.text)


#create database
URI="dublinbike.cckaxoirozab.eu-west-1.rds.amazonaws.com"
PORT=3306
DB="dublinbike"
USER="comp30830"
PASSWORD="dublinbike"
engine=create_engine("mysql+mysqldb://{}:{}@{}:{}/{}".format(USER,PASSWORD,URI,PORT,DB),echo=True)

import requests
import traceback
import datetime
import time
import json
apiKey="9d55c6cd0e9961febb4a8d1430262600db3ddd3d"
Name="Dublin"
STATIONS="https://api.jcdecaux.com/vls/v1/stations"

def write_to_file(r):
    now=datetime.datetime.now()
    with open("bikes_{}".format(now).replace(" ","_"),"w") as f:
        f.write(r.text)

def station_to_db(text):
    stations=json.loads(text)
    print(type(stations),len(stations))
    for station in stations:
        print(station)
        vals=(station.get("available_bikes"),station.get("available_bike_stands"),station.get("number"))
        # engine.execute("insert into station_availability values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",vals)
        engine.execute("update station_availability set available_bikes=%s,available_bike_stations=%s where number=%s",vals)
    return

#crawling
while True:
    now = datetime.datetime.now()
    r=requests.get(STATIONS,params={"apiKey":apiKey,"contract":Name})
    station_to_db(r.text)
    time.sleep(5*60)
