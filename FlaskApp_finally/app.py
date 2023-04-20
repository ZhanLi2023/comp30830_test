import functools
import traceback
from flask import g, render_template, send_from_directory
from sqlalchemy import create_engine, text
import config
import pymysql
import pickle
from flask import Flask, request, jsonify

pymysql.install_as_MySQLdb()

app = Flask(__name__)


# Establishes a connection to the database using the provided configuration details
def connect_to_database():
    engine = create_engine("mysql://{}:{}@{}:{}/{}".format(config.USER, config.PASSWORD, config.URI, config.PORT,
                                                           config.DB), echo=True)
    Connection = engine.connect()
    return Connection


# Get a database connection
def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = connect_to_database()
    return db


# Close a database connection
@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


# Home page
@app.route('/')
def home():
    return render_template("home.html")
# index page
@app.route('/index')
def index():
    return render_template("index.html")

# Get all station data from station_availability
@app.route("/stations")
@functools.lru_cache(maxsize=128)
def get_stations():
    engine = get_db()
    sql = "select * from station_availability;"
    try:
        with engine.begin() as conn:
            rows = conn.connection.execute(text(sql)).fetchall()
            print('#found {} stations', len(rows), rows)
            return jsonify([row._asdict() for row in rows])
    except:
        print(traceback.format_exc())
        return "error in get_stations", 404


# Get weekly data
@app.route('/weekly_data')
def get_weekly_data():
    number = request.args.get('number', type=int)
    if not number:
        return "Please provide a valid station number", 400

    engine = get_db()
    sql = text("""
        SELECT all_days.day, IFNULL(AVG(available_bikes), 0) as avg_bikes
        FROM (
            SELECT 'Monday' as day
            UNION ALL SELECT 'Tuesday'
            UNION ALL SELECT 'Wednesday'
            UNION ALL SELECT 'Thursday'
            UNION ALL SELECT 'Friday'
            UNION ALL SELECT 'Saturday'
            UNION ALL SELECT 'Sunday'
        ) as all_days
        LEFT JOIN availability ON all_days.day = DAYNAME(availability.last_update) AND availability.number = :number
        GROUP BY all_days.day
        ORDER BY FIELD(all_days.day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    """)
    try:
        with engine.begin() as conn:
            rows = conn.connection.execute(sql, {'number': number}).fetchall()
            return jsonify([row._asdict() for row in rows])
    except:
        print(traceback.format_exc())
        return "error in get_weekly_data", 404


# Get hourly data
@app.route('/hourly_data')
def get_hourly_info():
    number = request.args.get('number', type=int)
    day = request.args.get('day')
    if not number or not day:
        return "Please provide a valid station number and day", 400

    engine = get_db()
    sql = text("""
        SELECT HOUR(availability.last_update) as hour, IFNULL(AVG(available_bikes), 0) as avg_bikes
        FROM availability
        WHERE availability.number = :number AND DAYNAME(availability.last_update) = :day
        GROUP BY hour
        ORDER BY hour
    """)
    try:
        with engine.begin() as conn:
            rows = conn.connection.execute(sql, {'number': number, 'day': day}).fetchall()
            return jsonify([row._asdict() for row in rows])
    except:
        print(traceback.format_exc())
        return "error in get_hourly_info_data", 404


@app.route("/prediction", methods=['GET'])
def prediction():
    """
    This route handles the prediction of bike availability based on the provided
    input parameters: month, day, hour, and station. It fetches the latest weather
    data, processes it, and returns the predicted bike availability as a JSON object.
    """
    try:
        month = int(request.args.get('month'))
        day = int(request.args.get('day'))
        hour = int(request.args.get('hour'))
        station = int(request.args.get('station'))
    except (TypeError, ValueError):
        return "All parameters (month, day, hour, station) are required and should be numbers.", 400

    engine = create_engine("mysql://{}:{}@{}:{}/{}".format(config.USER, config.PASSWORD, config.URI, config.PORT,
                                                           config.DB), echo=True)
    sql = text("select * from weather ORDER BY time DESC LIMIT 1;")
    with engine.connect() as conn:
        result = conn.execute(sql)
        rows = result.fetchone()
    rows = list(rows)
    if rows[0] == "Rain":
        rows[0] = 1
    elif rows[0] == "Clouds":
        rows[0] = 2
    elif rows[0] == "Clear":
        rows[0] = 3
    elif rows[0] == "Mist":
        rows[0] = 4
    elif rows[0] == "Fog":
        rows[0] = 5
    elif rows[0] == "Drizzle":
        rows[0] = 6
    X_test = [[month, day, hour, rows[1], rows[6], rows[8], rows[0]]]
    with open('models/model' + str(station) + '.pkl', 'rb') as handle:
        model = pickle.load(handle)
    result = model.predict(X_test)
    result = list(result)
    return {'prediction': result}


# Serve the favicon
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(app.static_folder, 'favicon.ico')


if __name__ == '__main__':
    app.run(debug=True)
