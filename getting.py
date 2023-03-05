import requests
import json

# connect to api
apiKey="9d55c6cd0e9961febb4a8d1430262600db3ddd3d"
Name="Dublin"
STATIONS="https://api.jcdecaux.com/vls/v1/stations"
r=requests.get(STATIONS,params={"apiKey":apiKey,"contract":Name})
json.loads(r.text)

import sqlalchemy as sqla
from sqlalchemy import create_engine
import traceback
import glob
import os
from pprint import pprint
import simplejson as json
import requests
import time

#create database
URI="dbbikes.chdxsa0c6itr.eu-west-1.rds.amazonaws.com"
PORT=3306
DB="dbbikes"
USER="admin"
PASSWORD="xiaoxin123"
engine=create_engine("mysql+mysqldb://{}:{}@{}:{}/{}".format(USER,PASSWORD,URI,PORT,DB),echo=True)
sql="""
Create database if not exists dbbikes;
"""
engine.execute(sql)

# create table
sql="""
create table if not exists station(
address varchar(256),
banking integer,
bonus integer,
contract_name varchar(256),
name varchar(256),
number integer primary key,
position_lat real,
position_lng real,
status varchar(256))
"""
try:
    res=engine.execute(sql)
    print(res.fetchall())
except Exception as e:
    print(e)

sql="""
create table if not exists availability(
number integer,
available_bikes integer,
available_bikes_stands integer,
last_update integer,
primary key(number,last_update))
"""
try:
    res=engine.execute(sql)
    print(res.fetchall())
except Exception as e:
    print(e)

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
    with open("data/bikes_{}".format(now).replace(" ","_"),"w") as f:
        f.write(r.text)

def station_to_db(text):
    stations=json.loads(text)
    print(type(stations),len(stations))
    for station in stations:
        print(station)
        vals=(station.get("address"),int(station.get('banking')),int(station.get("bonus")),
             station.get("contract_name"),station.get("name"),station.get("number"),station.get("position").get("lat"),
              station.get("position").get("lng"),station.get("status"))
        engine.execute("insert into station values(%s,%s,%s,%s,%s,%s,%s,%s,%s)",vals)
    return

#crawling
def main():
    try:
        now=datetime.datetime.now()
        r=requests.get(STATIONS,params={"apiKey":apiKey,"contract":Name})
        print(r,now)
        write_to_file(r)
        station_to_db(r.text)
    except:
        print(traceback.format_exc())
#             if engine is None:
    return
# main()

def availability_to_db(text):
    now = datetime.datetime.now()
    stations=json.loads(text)
    print(type(stations),len(stations))
    for station in stations:
        print(station)
        vals=(station.get("number"),station.get("available_bikes"),
              station.get("available_bike_stands"),str(now))
        engine.execute("insert into availability values(%s,%s,%s,%s)",vals)
    return

while True:

    now = datetime.datetime.now()
    r=requests.get(STATIONS,params={"apiKey":apiKey,"contract":Name})
    print(r,now)
    availability_to_db(r.text)
    time.sleep(5*60)

