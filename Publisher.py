#!/usr/bin/env python
# coding: utf-8

# # Publisher

# In[ ]:


# simulate edge devices
import deep_learning_api
import serial
import redis
import sys
import time
import random
from datetime import datetime
import time
from scipy import stats
from collections import defaultdict

channel = "heart-rate"
patient_id = "2"
patient_name = "Zhenghao"
location = "Room A"
# host_name = "192.168.50.121"
host_name = "127.0.0.1"

#publisher = redis.Redis(host = host_name, port = 6379)
publisher = redis.Redis.from_url('redis://3.tcp.ngrok.io:23327')

date = str(datetime.now())

#  RECIEVE DATA FROM EDGE
ser = serial.Serial('/dev/ttyUSB0', 115200, timeout=1) #esp bpm
ser2 = serial.Serial('/dev/ttyUSB1', 115200, timeout=1)#location
ser.flush()
ser2.flush()

start_sending_location = False

db = dict()
patient_files = dict()

patient_record_temp = defaultdict(list)

start_time = time.time()

while True:
    try:
        if ser.in_waiting > 0:
            line = ser.readline().decode('utf-8').rstrip()
            info = line.rstrip().split("|")
            if(len(info) == 4):
                
                sent_data = line
                publisher.publish(channel, sent_data)
                start_sending_location = True
                if info[0] in db and len(patient_record_temp[info[0]])>30:
                    # start recording after receiving 30 data; 
                    db[info[0]].append(line)
                else:
                    db[info[0]] = [line]
                    patient_record_temp[info[0]].append(line)
                    
                    
                if info[0] not in patient_files:
                    file = open(date+"_record_"+ info[0] +".txt", "w")
                    patient_files[info[0]] = file
                    
                    
                if len(db[info[0]]) % 30==0:
                    ml_result = deep_learning_api.ml_prediction( db[info[0]] )#patient_file[info[0]])
                    print("ml result is:      ",ml_result)
                    if ml_result is -1:
                        pass
                    else:
                        
                        publisher.publish(channel, info[1]+"|"+ deep_learning_api.convert(ml_result) +"|"+"00")
                        patient_files[info[0]].write("\n".join(db[info[0]]))
                        db[info[0]] = list()
                        print("Result;  ", deep_learning_api.convert(ml_result))
            print(line)
            
        if ser2.in_waiting > 0:
            line2 = ser2.readline().decode('utf-8').rstrip()
            
            info2 = line2.split("|")
            if (len(info2) == 2 and start_sending_location):
                
                if time.time()-start_time>=5:
                    start_time = time.time()
                    location_data = str(int(info2[0]))+"|"+info2[1].replace(" ", "") #+"|"+str(time.time())
                    publisher.publish(channel, location_data)
                    print(location_data)
                        

    except UnicodeDecodeError:
        print("decode exception once")

# In[ ]:




