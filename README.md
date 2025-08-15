# **Smart Fridge**

This project is a web-based application for tracking RFID tags. It uses a Node.js backend to communicate with an RFID reader via a serial port and a simple front-end to display real-time inventory updates.

The application supports different modes of operation, including an inventory mode that filters scanned tags against a predefined inventory list.

## **How it Works**

The system operates as a single-process application:

1. **Server Initialization**: When index.js starts, it launches an Express web server and a WebSocket server.  
2. **Serial Port Communication**: It connects directly to the specified serial port, handling low-level RFID protocol bytes.  
3. **Inventory Loading**: If configured, it reads the inventory.csv file and loads the EPCs and item names into an in-memory map.  
4. **Web Client Interaction**: A user opens index.html in their browser, which establishes a WebSocket connection.  
5. **Data Exchange**: When the user clicks "Start Scanning," a command is sent via WebSocket to the server. The server, in turn, sends the appropriate hex command to the RFID reader.  
6. **Real-time Updates**: As the RFID reader scans tags, the index.js script processes the data. It filters the results based on the inventory and refresh period, then sends a JSON payload to all connected web clients via WebSocket.  
7. **UI Refresh**: The app.js file on the client-side receives the JSON data, updates its internal state, and redrawing the table on the webpage to reflect the latest scan results.
## **Folder Structure**

The project is organized into the following directory structure:

```
├── index.js                  # Main application file (combines server and RFID logic)  
├── README.md                 # Project documentation  
├── web-app  
│   ├── app.js                # Front-end JavaScript for real-time updates  
│   ├── index.html            # The main web page UI  
│   └── style.css             # Styling for the web page  
└── work  
    ├── doors.csv             # Inventory list for door RFID tags  
    └── inventory.csv         # Main inventory list for all other items
```

## **Files Overview**

* **index.js**: This is the core of the application. It runs a web server with a WebSocket gateway and directly manages the serial communication with the RFID reader. It handles the RFID protocol, processes incoming data, and sends updates to the connected web clients.  
* **web-app/index.html**: The single-page web interface. It contains a table to display the inventory status, buttons to control the scanning process, and a status indicator for the WebSocket connection.  
* **web-app/app.js**: The client-side logic. It establishes a WebSocket connection with the server, listens for inventory updates, and dynamically updates the table on the webpage. It also handles user interaction with the "Start" and "Stop" buttons.  
* **web-app/style.css**: The stylesheet for the web interface, providing a clean and responsive design.  
* **work/inventory.csv**: A CSV file containing the master list of RFID tags to be tracked. The columns are id, EPC, and item.  
* **work/doors.csv**: Another CSV file for a separate inventory of door tags.

## **Usage**

### **Prerequisites**

Before you begin, ensure you have the following hardware:

  * **Hardware:**
      * A Raspberry Pi 4
      * An RFID reader module (e.g., model KLM900P with antenna)
      * A USB to UART cable and a 15-pin ribbon cable for connecting the reader to the Pi
      * UHF RFID tags for your items
      * A microSD card for the Raspberry Pi's operating system (A 32GB microSD card is recommanded)


### **Initial Setup**

1. **Install Raspberry Pi Imager**: Download and install the [Raspberry Pi Imager](https://www.raspberrypi.com/software/) on your computer.  
2. **Flash the OS Image**: Use the imager to flash the **Raspberry Pi OS (64-bit)** onto your microSD card. Before writing the image, click the settings icon (⚙️) to configure the OS. Make sure to:  
   * Set the hostname to `smart-fridge.local` .
   * Configure your Wi-Fi SSID and password to make Raspberry Pi connect to your WiFi AP.
3. **Boot the Pi**: Insert the microSD card into your Raspberry Pi and power it on.
4. **Login the Pi**: Wait for 1 minute and login the Pi with the following command if it is connected to the WiFi AP and the hostname is set to `smart-fridge.local` properly. (The password is `raspberry` by default)

```bash
ssh pi@smart-fridge.local
```

Then, git clone the code with the following command 

```bash 
git clone https://gitea.t2t.io/clement/smart-fridge.git
```

After cloning the source code, navigate to the project directory.

```bash
cd smart-fridge
```

Next, you need to install **nvm (Node Version Manager)** to easily manage your Node.js versions.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

After installation, reload your terminal. Then, install Node.js v22 and set it as the default version.

```bash
nvm install 22  
nvm use 22
```

The project also requires the express, ws, and serialport packages. You can install them by running:

```bash
npm install express ws serialport
```

### **Preparing the Inventory**

The application uses an inventory file to identify items. You must create this file and populate it with your RFID tag information. If you have the UHF RFID tags and know the EPC of these tags, you can simply edit and prepare the inventory list, `work/inventory.csv`,  in the following steps.

1.  Open the **`work/inventory.csv`** file in a text editor or spreadsheet program.
2.  Populate the file with three columns: **`id`**, **`EPC`** (the unique code from your RFID tag), and **`item`** (the item name, e.g., "butter" or "apple"). For example:
```csv
id,EPC,item
1,E28069150000401F7AB5F1BB,turkey-ham
2,E28069150000501F7AB5EDBB,turkey-ham
3,E28069150000501F7AB605BB,butter
4,E28069150000401F7AB5E9BB,butter
5,E28069150000401F7AB601BB,salad
```
1. The system calculate the number of the items by checking the EPC in the same item, for instance, in the list above, there are 2 EPCs in the same item, `turkey-ham`. If both EPCs of `turkey-ham` are scanned, the quantity of will be 2 on the `web interface` which will be talked about later.

### **Running the Application**

To start the application, run the index.js file with Node.js.

```bash
node index.js --mode=inventory --inventory=./work/inventory.csv --refresh-period=3 --dbg=0
```

By default, the application will start in inventory mode and check for the inventory.csv file. The `web interface` will be available at http://smart-fridge.local:8080.

### **Command-Line Arguments**

You can customize the application's behavior using the following command-line arguments:

| Argument | Description | Example |
| :---- | :---- | :---- |
| \--mode=\<mode\> | Sets the operational mode. Available modes are auto, inventory, and interactive. auto and inventory modes automatically start the scanning process. inventory mode filters the scanned tags against the provided inventory list. | \--mode=inventory |
| \--inventory=\<path\> | Specifies the path to the inventory CSV file. This is mandatory for inventory mode. | \--inventory=./work/inventory.csv |
| \--refresh-period=\<seconds\> | Sets the time interval (in seconds) for updating the log on the web page. | \--refresh-period=5 |
| \--dbg=\<0 or 1\> | Enables or disables debug logs. 0 turns logs off, 1 turns them on. Debug logs are on by default. | \--dbg=0 |

### **Using the Web Interface**

1.  Open a web browser on any device on the same network as your Raspberry Pi.
2.  Navigate to **`http://smart-fridge.local:8080`**.
3.  The web page will display an **Item Summary** and a detailed **All Scanned EPCs** table.
4.  Click the **"Start Scanning"** button to begin the scan session.
5.  As you scan items, the tables will update automatically every refresh period. The `Item Summary` will show a count of each item type, and the `All Scanned EPCs` list will show individual tag information.
6.  Click **"Stop Scanning"** to end the session. This will also trigger the saving of a detailed log.

To **gracefully shut down** the application, press `Ctrl+C` in the terminal where the program is running. A log file named **`epc_scan_data.tsv`** will be saved in your project's root directory.


### **Optional: Autostart on Raspberry Pi**

To make the RFID server start automatically whenever your Raspberry Pi is powered on, you can create a systemd service. This is the standard way to manage services on modern Linux systems.

#### **1\. Create the systemd Service File**

First, create a new service file named rfid-server.service in the /etc/systemd/system/ directory.

```bash
sudo nano /etc/systemd/system/rfid-server.service
```

#### **2\. Add the Service Configuration**

Copy and paste the following content into the file. Be sure to change `/home/pi/smart-fridge/` to the actual path of your project on the Raspberry Pi.

```
[Unit]  
Description=RFID Server for Smart Fridge
After=network.target

[Service]
ExecStart=/usr/bin/node /home/pi/smart-fridge/index.js --mode=inventory --inventory=/home/pi/smart-fridge/work/inventory.csv --refresh-period=3 --dbg=0  
WorkingDirectory=/home/pi/smart-fridge 
Restart=always  
User=pi  
Environment=PATH=/usr/bin:/usr/local/bin  
Environment=NODE_ENV=production

[Install]  
WantedBy=multi-user.target
```

* ExecStart: Specifies the command that will be run to start the service.  
* WorkingDirectory: Sets the directory where the command will be executed, which is essential for the script to find its relative paths.  
* User: Runs the service as the pi user, which has the necessary permissions.  
* Restart: Ensures the service automatically restarts if it crashes.

#### **3\. Enable and Start the Service**

After saving the file, run the following commands to enable the service and start it immediately.

```bash
sudo systemctl enable rfid-server.service  
sudo systemctl start rfid-server.service
```

#### **4\. Check the Status**

You can check the status of your service to make sure it's running correctly.

```bash
sudo systemctl status rfid-server.service
```

Now, your RFID server will automatically launch every time your Raspberry Pi boots up!

