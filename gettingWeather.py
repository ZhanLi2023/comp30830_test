import requests
import sqlalchemy as sqla
from sqlalchemy import create_engine
import traceback
import glob
import os
from pprint import pprint
import simplejson as json
import time
import datetime
import json

api_key = '65c931bf3d4f99dfdcfe83fb7a16fac8'
city = 'Dublin,IE'

url = f'https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units="metric"'

response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    print(data)
else:
    print('Failed to retrieve weather data')

URI="dbbikes.chdxsa0c6itr.eu-west-1.rds.amazonaws.com"
PORT=3306
DB="dbbikes"
USER="admin"
PASSWORD="xiaoxin123"
engine=create_engine("mysql+mysqldb://{}:{}@{}:{}/{}".format(USER,PASSWORD,URI,PORT,DB),echo=True)

def writeWeather_to_file(r):
    now=datetime.datetime.now()
    with open("weather/weather_{}".format(now).replace(" ","_"),"w") as f:
        f.write(str(r))

def weather_to_db(text):
    weather=text
    now=datetime.datetime.now()
    print(weather.get("weather")[0].get("main"))
    weather_vals=(weather.get("weather")[0].get("main"),weather.get("main").get("temp"),weather.get("main").get("feels_like"),weather.get("main").get("temp_min"),weather.get("main").get("temp_max"),weather.get("main").get("pressure"),weather.get("main").get("humidity"),weather.get("visibility"),weather.get("wind").get("speed"),weather.get("wind").get("deg"),now)
    engine.execute("insert into weather values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",weather_vals)
    return

def getData():
    try:
        now=datetime.datetime.now()
        r= requests.get(url)
        r=r.json()
        print(r)
        writeWeather_to_file(r)
        weather_to_db(r)
    except:
        print(traceback.format_exc())
    return
number=1
while True:
    getData()
    time.sleep(60*60)