import functools
import traceback
from flask import Flask, g, render_template, jsonify
from sqlalchemy import create_engine, text
import config
import pymysql
pymysql.install_as_MySQLdb()


#
# pymysql.install_as_MySQLdb()
#
app = Flask(__name__)
#
# Create an engine object to connect to the database
def connect_to_database():
    engine = create_engine("mysql://{}:{}@{}:{}/{}".format(config.USER, config.PASSWORD, config.URI, config.PORT, config.DB), echo=True)
    Connection=engine.connect()
    return Connection

def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = connect_to_database()
    return db

@app.route('/')
def index():
    return render_template("test_2.html")
# def index():
#     engine = connect_to_database()
#     # Create a connection object using the engine's connect method
#     with engine.connect() as connection:
#         # Use text() function to create a SQL query string from a SQLAlchemy expression
#         query = text('SELECT * FROM station')
#
#         # Execute the SQL query using the connection object
#         result = connection.execute(query)
#
#         # Fetch the query results
#         rows = result.fetchall()
#
#     # Return the results as a string
#     return str(rows)

# @app.route('/stations')
# def stations():
#     engine = connect_to_database()
#     # Create a connection object using the engine's connect method
#     with engine.connect() as connection:
#         # Use text() function to create a SQL query string from a SQLAlchemy expression
#         query = text('SELECT * FROM station')
#
#         # Execute the SQL query using the connection object
#         result = connection.execute(query)
#
#         # Fetch the query results
#         rows = result.fetchall()
#
#     # Return the results as a string
#     return str(rows)
# import functools
#
# if __name__ == '__main__':
#     app.run(debug=True)
# from flask import Flask, render_template
#
# app = Flask(__name__)
#
# # Replace YOUR_API_KEY with your actual Google Maps API key
# GOOGLE_MAPS_API_KEY = "AIzaSyAJH9Z3Zk6rXOWWpcxPNym-eAUnYzADrjM"
#

@app.route("/stations")
@functools.lru_cache(maxsize=128)
def get_stations():
    engine = get_db()
    sql = "select * from station ;"
    try:
        with engine.connect() as conn:
            rows = conn.execute(text(sql)).fetchall()
            print('#found {} stations', len(rows), rows)
            return jsonify([row._asdict() for row in rows]) # use this formula to turn the rows into a list of dicts
    except:
        print(traceback.format_exc())
        return "error in get_stations", 404

# @app.route("/stations")
# @functools.lru_cache(maxsize=128)
# def get_stations():
#     engine = get_db()
#     stations = []
#     try:
#         # rows = engine.execute("SELECT * from station;")
#         rows = engine.execute(
#             "SELECT station.number,name,address,position_lat,position_lng,status,bike_stands,available_bikes_stands,available_bikes,MAX(last_update) as last_update from availability join station WHERE station.number = availability.number GROUP BY availability.number;")
#         for row in rows:
#             stations.append(dict(row))
#         return jsonify(stations=stations)
#     except:
#         print(traceback.format_exc())
#         return "error in get_stations", 404

if __name__ == '__main__':
    app.run(debug=True)

