#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <LittleFS.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>

// Rede local criada pelo ESP32: funciona mesmo sem internet.
constexpr char WIFI_NAME[] = "PILHA-LAB";
constexpr char WIFI_PASSWORD[] = "PilhaLab2026"; // Pelo menos 8 caracteres.

// Divisor: positivo da pilha -- 1 MOhm -- A0 -- 330 kOhm -- GND.
constexpr float R_TOP_OHMS = 1000000.0f;
constexpr float R_BOTTOM_OHMS = 330000.0f;
constexpr float CALIBRATION_FACTOR = 1.0f; // Alterar somente apos comparar com multimetro.
constexpr float MAX_INPUT_VOLTS = 10.0f; // Limite de uso recomendado para este projeto.

WebServer server(80);
Adafruit_ADS1115 ads;
bool sensorOK = false;
float latestVoltage = 0.0f;
unsigned long lastRead = 0;

bool readingReady = false;
bool converting = false;
unsigned long conversionStarted = 0;
float sampleTotal = 0.0f;
uint8_t sampleCount = 0;

bool sensorPresent() {
  Wire.beginTransmission(0x48);
  return Wire.endTransmission() == 0;
}

void invalidateSensor() {
  sensorOK = false;
  readingReady = false;
  converting = false;
  sampleTotal = 0.0f;
  sampleCount = 0;
  lastRead = millis();
}

void updateReading() {
  const unsigned long now = millis();
  if (!sensorOK) {
    if (now - lastRead < 1000) return;
    lastRead = now;
    if (!sensorPresent() || !ads.begin(0x48, &Wire)) return;
    ads.setGain(GAIN_ONE);
    ads.setDataRate(RATE_ADS1115_128SPS);
    sensorOK = true;
  }
  if (!converting) {
    if (now - lastRead < 550) return;
    if (!sensorPresent()) { invalidateSensor(); return; }
    ads.startADCReading(ADS1X15_REG_CONFIG_MUX_SINGLE_0, false);
    conversionStarted = now;
    converting = true;
    return;
  }
  // Nonblocking conversion: a disconnected ADC must not freeze the web server.
  if (!sensorPresent() || now - conversionStarted > 150) {
    invalidateSensor(); return;
  }
  if (!ads.conversionComplete()) return;
  const int16_t raw = ads.getLastConversionResults();
  if (!sensorPresent() || raw < 0) { invalidateSensor(); return; }
  sampleTotal += ads.computeVolts(raw);
  ++sampleCount;
  converting = false;
  if (sampleCount < 5) return;
  latestVoltage = (sampleTotal / sampleCount) *
    ((R_TOP_OHMS + R_BOTTOM_OHMS) / R_BOTTOM_OHMS) * CALIBRATION_FACTOR;
  readingReady = true;
  sampleTotal = 0.0f;
  sampleCount = 0;
  lastRead = now;
}

void sendReading() {
  server.sendHeader("Cache-Control", "no-store, max-age=0");
  if (!sensorOK || !readingReady || !sensorPresent()) {
    server.send(503, "application/json; charset=utf-8", "{\"sensor_ok\":false,\"voltage\":null,\"unit\":\"V\",\"over_limit\":false}");
    return;
  }
  String output = "{\"sensor_ok\":true,\"voltage\":";
  output += String(latestVoltage, 4);
  output += ",\"unit\":\"V\",\"over_limit\":";
  output += (latestVoltage > MAX_INPUT_VOLTS) ? "true" : "false";
  output += ",\"millis\":" + String(millis()) + "}";
  server.send(200, "application/json; charset=utf-8", output);
}

void sendFile(const char* path, const char* mime) {
  File file = LittleFS.open(path, "r");
  if (!file) {
    server.send(404, "text/plain; charset=utf-8", "Arquivo nao encontrado. Envie LittleFS: pio run -t uploadfs");
    return;
  }
  server.sendHeader("Cache-Control", "no-cache");
  server.streamFile(file, mime);
  file.close();
}

void setup() {
  Serial.begin(115200);
  delay(250);
  Wire.begin(21, 22);
  Wire.setTimeOut(50); // ESP32 DevKit: SDA 21 e SCL 22.
  sensorOK = ads.begin(0x48, &Wire);
  if (sensorOK) {
    ads.setGain(GAIN_ONE); // escala +/-4.096 V; pino fisico limitado por VDD=3.3 V.
    ads.setDataRate(RATE_ADS1115_128SPS);
    Serial.println("ADS1115 detectado no I2C 0x48");
  } else {
    Serial.println("ADS1115 NAO encontrado. Verifique VDD/GND/SDA/SCL/ADDR.");
  }

  if (!LittleFS.begin(false)) {
    Serial.println("Falha ao montar LittleFS.");
  }

  WiFi.mode(WIFI_AP);
  WiFi.softAP(WIFI_NAME, WIFI_PASSWORD);
  Serial.print("Conecte ao Wi-Fi PILHA-LAB e abra http://");
  Serial.println(WiFi.softAPIP());

  server.on("/", HTTP_GET, [](){ sendFile("/index.html", "text/html; charset=utf-8"); });
  server.on("/styles.css", HTTP_GET, [](){ sendFile("/styles.css", "text/css; charset=utf-8"); });
  server.on("/logic.js", HTTP_GET, [](){ sendFile("/logic.js", "application/javascript; charset=utf-8"); });
  server.on("/app.js", HTTP_GET, [](){ sendFile("/app.js", "application/javascript; charset=utf-8"); });
  server.on("/favicon.svg", HTTP_GET, [](){ sendFile("/favicon.svg", "image/svg+xml"); });
  server.on("/api/reading", HTTP_GET, sendReading);
  server.onNotFound([](){ server.send(404, "text/plain; charset=utf-8", "Rota nao encontrada"); });
  server.begin();
}

void loop() {
  updateReading();
  server.handleClient();
  delay(5);
}
