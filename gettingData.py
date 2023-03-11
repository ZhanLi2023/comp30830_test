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


apiKey="9d55c6cd0e9961febb4a8d1430262600db3ddd3d"
Name="Dublin"
STATIONS="https://api.jcdecaux.com/vls/v1/stations"
r=requests.get(STATIONS,params={"apiKey":apiKey,"contract":Name})
r=json.loads(r.text)
print(r)

URI="dbbikes.chdxsa0c6itr.eu-west-1.rds.amazonaws.com"
PORT=3306
DB="dbbikes"
USER="admin"
PASSWORD="xiaoxin123"
engine=create_engine("mysql+mysqldb://{}:{}@{}:{}/{}".format(USER,PASSWORD,URI,PORT,DB),echo=True)

def write_to_file(r):
    now=datetime.datetime.now()
    with open("data/bikes_{}".format(now).replace(" ","_"),"w") as f:
        f.write(r.text)

def availability_to_db(text):
    now = datetime.datetime.now()
    stations=json.loads(text)
    print(type(stations),len(stations))
    for station in stations:
        # print(station)
        vals=(station.get("number"),station.get("available_bikes"),
              station.get("available_bike_stands"),str(now))
        # engine.execute("update availability set available_bikes=%s,available_bikes_stands=%s,last_update=%s where number=%s",vals)
        engine.execute("insert into availability values(%s,%s,%s,%s)",vals)
    return

while True:
    now = datetime.datetime.now()
    r=requests.get(STATIONS,params={"apiKey":apiKey,"contract":Name})
    print(r,now)
    write_to_file(r)
    availability_to_db(r.text)
    time.sleep(5*60)