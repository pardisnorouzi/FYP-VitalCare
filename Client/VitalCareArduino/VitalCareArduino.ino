#include "DFRobot_BloodOxygen_S.h"
#include <DFRobot_MLX90614.h>
#include "WiFiS3.h"
#include "WiFiSSLClient.h"
#include <ArduinoJson.h> 
#include "Arduino.h"
#include "DFRobotDFPlayerMini.h"
#include <Wire.h>


//===========================Shared Setup
#define I2C_COMMUNICATION  // use I2C for communication, 
#define BUTTON_PIN 2       // Pin for the push button
char sessionId[10]; //Session ID storage

//===========================Wifi Setup
char ssid[] = "WifiUsername";      
char pass[] = "WifiPass";  
WiFiSSLClient client;

//===========================SPO2 & HR Constants
DFRobot_BloodOxygen_S_I2C MAX30102(&Wire, 0x57);
int lastSPO2 = 0;
int averageHR = 0;


//===========================Temp Constants
#define MLX90614_I2C_ADDR 0x5A   // mlx9614 default I2C communication address
DFRobot_MLX90614_I2C sensor(MLX90614_I2C_ADDR, &Wire);   // instantiate an object to drive the sensor
float corTemp = 0;

//===========================AWS Setup
// AWS API Gateway endpoint details
const char *host = "54t3lsv6if.execute-api.eu-north-1.amazonaws.com";
const char *apiKey = "A9B5h0z3935d9PEH0p5On6rjTEM9nFKhAhwTP13b";
const char *endpoint = "/prod/ingest";
const int port = 443;

//===========================ECG Setup
#define ECG_PIN A1
const int ECGreadingsPerSecond = 10; //i.e. delay of 100 between each reading
const int ECGtotalReadings = 10 * ECGreadingsPerSecond; //10 seconds
const int ECGmaxAttempts = 4;
const unsigned long ECGmaxRecordingTime = 60000;

//===========================Audio Player setup
#define FPSerial Serial1
DFRobotDFPlayerMini myDFPlayer;
void play(int audio, unsigned long delayDuration); // needs to be declared now so we have access to this function before its called in setup. main body of function is below


void setup() {
  FPSerial.begin(9600);

  Serial.begin(115200);

// Setting up MP3 Player (it is needed to be done first so we have access to audio playback)
  Serial.println();
  Serial.println(F("Initializing DFPlayer ... (May take 3~5 seconds)"));

  if (!myDFPlayer.begin(FPSerial, /*isACK = */true, /*doReset = */true)) {  //Use serial to communicate with mp3.
    Serial.println(F("Unable to begin:"));
    Serial.println(F("1.Please recheck the connection!"));
    Serial.println(F("2.Please insert the SD card!"));
    while(true){
      delay(0); // Code to compatible with ESP8266 watch dog.
    }
  }
  Serial.println(F("DFPlayer online."));
  myDFPlayer.volume(30);


  play(1,2000);
  play(22,3000);
  play(6,3000);

  //===========================Initializing button

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  //===========================Intializing SPO2/HR sensor
  while (false == MAX30102.begin()) {
    Serial.println("Communication with the Spo2 and Heart Rate device failed, please check connection");
    delay(1000);
  }

  MAX30102.sensorStartCollect();

//===========================Initializing Temp Sensor
    // initialize the sensor
  while( NO_ERR != sensor.begin() ){
    Serial.println("Communication with the Temp device failed, please check connection");
    delay(3000);
  }

  sensor.enterSleepMode();
  delay(50);
  sensor.enterSleepMode(false);
  delay(200);

  Serial.println("init success!");  


  

  play(7,2000);

  connect_wifi();

  
}

void loop() {

  //Serial.println("Loop Started");
  
  generateSessionId();//generating a new session id at the begining of every loop/reading
  measure_spo4hr();
  measure_temp();
  recordECGData();


  Serial.println(lastSPO2);
  Serial.println(averageHR);
  Serial.println(corTemp); 

  play(23,6000);
  play(24,500);
  waitForButtonPress(); 
  
}


void play(int audio, unsigned long delayDuration = 1000) {
  if (audio < 1 || audio > 9999) {
    Serial.println(F("Invalid audio file number."));
    return; // Return early if the audio file number is invalid
  }
  myDFPlayer.play(audio);
  delay(delayDuration);
}

void measure_spo4hr() {
  bool SPO2HR = false; // Initialize SPO2HR as false
  
  while (!SPO2HR) {
    Serial.println("Please put the sensor on your finger and press the button when ready.");
    play(8,500);
    waitForButtonPress(); // Wait for button press or timeout

    play(9,5000);
    Serial.println("Measurement Started");
    int Spo2Tries = 0;
    delay(5000); // Delay for 10 seconds in toal with audio

    while (Spo2Tries < 7) {
      Spo2Tries++;
      delay(500);
      Serial.print("Try No: ");
      Serial.println(Spo2Tries);

      int spo2Total = 0;
      int hrTotal = 0;
      int validCount = 0;

      for (int i = 0; i < 4; i++) { // Measure SPO2 and HR 4 times
        MAX30102.getHeartbeatSPO2();
        int heartRate = MAX30102._sHeartbeatSPO2.Heartbeat;
        int spo2 = MAX30102._sHeartbeatSPO2.SPO2;

        // Check if readings are valid
        if (isValidReading(heartRate, spo2)) {
          hrTotal += heartRate;
          spo2Total = spo2;
          validCount++;
        }
      }

      Serial.println("Measurement Finished");

      // If all readings are valid, set SPO2 and HR
      if (validCount == 4) {
        lastSPO2 = spo2Total;
        averageHR = hrTotal / 4;
        SPO2HR = true;
        Serial.println("Measurement Done");
        sendDataToAPI("SPO2", String(lastSPO2)); // Send SpO2 
        sendDataToAPI("HR", String(averageHR));
        play(10,6000);
        break;
      } else {
        Serial.println("Invalid readings.");
      }
    }

    if (!SPO2HR) {
      Serial.println("Invalid measuements. Restarting...");
      play(11,4000);
    }
  }
}



void measure_temp() {
  bool tempMeasured = false;

  while (!tempMeasured) {
    Serial.println("Hold the temp Sensor within 7 cm of your forehead and push the button when ready!");
    play(12,500); //we don't need to wait because wait for button is there.
    waitForButtonPress(); // Wait for button press or timeout
    play(13,4000);
    Serial.println("Measurement Started");
    float objectTemp = sensor.getObjectTempCelsius();           
    if (objectTemp < 28 || objectTemp > 50) {
      Serial.println("Invalid temp."); 
      play(11,4000);
      //delay(500);
    } else {
      corTemp = objectTemp + 3;//correction of Temp
      Serial.print("Body Temp : ");
      Serial.print(corTemp);
      Serial.println(" °C");
      Serial.println("Measurement done!");
      tempMeasured = true;
      sendDataToAPI("Temp", String(corTemp)); // Send Temp
      play(14,5000);
      //delay(1000);
    }
  }
}


void sendDataToAPI(const char *sensorType, String sensorValue) {
  // Create a JSON object
  StaticJsonDocument<200> jsonDocument;
  jsonDocument["deviceId"] = "1";
  //jsonDocument["timeStamp"] = sessionId;
  jsonDocument["sensorType"] = sensorType;
  jsonDocument["sensorValue"] = sensorValue;
  jsonDocument["sessionId"] = sessionId;

  // Serialize the JSON to a buffer
  char buffer[512];
  size_t n = serializeJson(jsonDocument, buffer);

  // Make a HTTPS request to the API Gateway
  if (client.connect(host, port)) {
    client.println("POST " + String(endpoint) + " HTTP/1.1");
    client.println("Host: " + String(host));
    client.println("x-api-key: " + String(apiKey));
    client.println("Content-Type: application/json");
    client.println("Content-Length: " + String(n));
    client.println();
    client.println(buffer);
    client.println();
  } else {
    Serial.println("Failed to connect to server.");
  }

  // Wait for response
  while (client.connected() && !client.available());

  while (client.available()) {
    char c = client.read();
    Serial.print(c);
  }

  client.stop();
}


bool isValidReading(int heartRate, int spo2) {
  // Perform range checks on heart rate and SpO2
  if (heartRate < 30 || heartRate > 200 || spo2 < 50 || spo2 > 100) {
    return false;
  }
  return true;
}
void connect_wifi(){

  play(2,3000);

  if (WiFi.begin(ssid, pass) == WL_NO_SHIELD) {
    Serial.println("WiFi shield not present");
    while (true);
  }
  

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print("Attempting to connect to SSID: ");
    play(4,3000);   
    Serial.println(ssid);

    // Connect to WiFi network
    if (WiFi.begin(ssid, pass) != WL_CONNECTED) {
      Serial.println("Failed to connect to network, retrying...");
      play(5,5000);
      //delay(5000);
    }
  }

  // Print connection details
  Serial.println("Connected to WiFi");

  play(3,3000);
}

void recordECGData() {
  play(15,3000);
  while (true) {
    Serial.println("Put the ECG leads on and press the button when ready.");
    play(16,5000);
    play(17,500);
    waitForButtonPress(); // Wait for the button press
    play(18, 6000);//originaly 6000
    unsigned long startTime = millis();
    bool validReading = false;
    int attempt = 0;
    String ecgDataString = ""; 

    while (millis() - startTime < ECGmaxRecordingTime) {
      Serial.println("Recording...");
      int ecgData[ECGtotalReadings];
      bool validData = true;

      int minReading = 1023; 
      int maxReading = 0;    

      // Record data for 10 seconds
      for (int i = 0; i < ECGtotalReadings; i++) {
        int ecgValue = analogRead(ECG_PIN);//reading the value
        Serial.println(ecgValue);

        // Validation 1: Check if the reading is below 50 or above 720
        if (ecgValue < 50 || ecgValue > 720) {
          Serial.println("Reading invalid, retrying");
          validData = false; // Data is not valid
          break; // Restart the reading
        }

        ecgData[i] = ecgValue;

        if (ecgValue < minReading) {
          minReading = ecgValue;
        }
        if (ecgValue > maxReading) {
          maxReading = ecgValue;
        }
        delay(1000 / ECGreadingsPerSecond); // Delay to achieve readings per second
      }

      if (!validData) {
        attempt++; // Increase the attempt counter
        play(19,500);
        continue; // Restart the recording
      }

      // Validation 2: Check if the difference between min and max readings is less than 300
      if (abs(maxReading - minReading) < 300) {
        if (attempt == ECGmaxAttempts - 1) {
          Serial.println("No valid readings after multiple attempts.");
          play(11,4000);
          break; // Exit loop and restart the process
        }
        Serial.println("Reading invalid");
        play(19,500);
        attempt++; // Increase the attempt counter
        continue; // Restart the recording
      }

      for (int i = 0; i < ECGtotalReadings; i++) {
        ecgDataString += String(ecgData[i]);
        if (i < ECGtotalReadings - 1) {
          ecgDataString += ","; // Add comma separator except for the last value
        }
      }
      Serial.println("ECG Data: " + ecgDataString);
      Serial.println("Valid reading acquired.");
      sendDataToAPI("ECG", ecgDataString);
      play(20,5000);
      validReading = true;
      break; // Exit loop
    }

    if (!validReading) {
      Serial.println("No valid readings within 60 seconds. Please try again.");
      play(11,4000);
    } else {
      break; // Exit the function if valid data is obtained
    }
  }
}

void waitForButtonPress() {
  unsigned long startTime = millis(); // Get the current time
  while (digitalRead(BUTTON_PIN) == LOW) {
    if (millis() - startTime >= 20000) { // If 20 seconds have passed
      //("Button was not pressed. Please press the button when ready");
      play(21,500);
      startTime = millis(); // Reset the start time for the next iteration
    }
    delay(100); 
  }
}

void generateSessionId() {

  // Seed the random number generator
  randomSeed(analogRead(0));
  
  const char charset[] = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"; 
  const int charsetLength = sizeof(charset) - 1; 
  
  // Generate the session ID
  for (int i = 0; i < 9; ++i) {
    sessionId[i] = charset[random(0, charsetLength)];
  }
  
  sessionId[9] = '\0'; 
  


}

// 0001 Welcome to Vital Care.
// 0002 Lets get you connected to the Internet.
// 0003 Perfect. We are now connected to the Internet.
// 0004 Trying to connect to your WiFi. Please wait...
// 0005 Looks like I am having trouble connecting to your WiFi. Lets try again...
// 0006 Your device is being setup... 
// 0007 Device setup is complete.
// 0008 Please put the oxygen sensor on your finger and when ready press the button.
// 0009 Measuring your oxygen level and heart rate. Please keep your finger steady...
// 0010 Great. I now have your Oxygen Level and Heart Rate and I have uploaded them to the app.
// 0011 Looks like I am getting invalid readings, Lets try again.. 
// 0012 Please hold the temperature sensor next to your forehead and press the button when ready...
// 0013 Measuring your temperature now. Please hold the sensor steady..
// 0014 Great. I have your temperature reading now and have uploaded it to the app.
// 0015 Lets get your heart tracing now.
// 0016 Please attach the ECG leads according to instructions and press the button when ready.
// 0017 Connect Yellow to your Left arm, Red to your Right arm, and Green to your Right foot.
// 0018 Please remain still while I capture your heart rhythm. Even small movements can lead to inaccurate results.
// 0019 Recording is still in progress.
// 0020 Great. I now have your heart tracing and have uploaded it to the app.
// 0021 I haven't detected any button presses for the past 20 seconds. Please press the button when you're ready.
// 0022 Discover the healing world of smart health monitoring
// 0023 Your measurements have been successfully completed. Both you and your doctor can see the results on the website.
// 0024 If you wish to send another reading, simply press the button once more. Otherwise, you can safely power off your device now.