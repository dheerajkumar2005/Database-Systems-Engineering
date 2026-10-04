from pyspark.sql import SparkSession
from pyspark.sql.functions import * # type: ignore
from pyspark.sql.types import * # type: ignore

import sys
spark = SparkSession.builder.appName("Fraud detection model").getOrCreate()

df = spark.read.csv(sys.argv[1],header=True,inferSchema=True)

trns_per_user = df.groupby("user_id").count()
trns_per_user.show()
max_trns_per_user = trns_per_user.agg({"count" : "max"}).collect()[0][0]
users_with_max_trns = trns_per_user.select("user_id").where(col("count")==max_trns_per_user)
top_users = users_with_max_trns.sort(col("user_id")).limit(10).collect()

for user in top_users:
    print(user["user_id"])

cities_per_users = df.groupBy("user_id").agg(count_distinct("city").alias("cities"))
failed_trns_per_user = df.groupBy("user_id").agg(sum(when(col("status")=="FAILED",1).otherwise(0)).alias("failed_count"))

stats = trns_per_user.join(cities_per_users,col("user_id")).join(failed_trns_per_user,"user_id")
susp_users = stats.filter((col("count") > 5000) | (col("cities") > 10) | (col("failed_count") > 50))

top_susp_users = susp_users.sort("user_id").limit(10).collect()

spark.stop()
