# Self Managaed Microsoft AD on an EC2 Instance (Windows Server 2019)

This app will deploy following:

* VPC with 2 subnets and 1 NATGW
* 3 EC2 instances for MS AD Domain Controller
* 1 EC2 instance for an user

## Deploy

```sh
npm install
cdk synth -c myIpAddress="$(curl --no-progress-meter https://checkip.amazonaws.com/)/32"
cdk deploy -c myIpAddress="$(curl --no-progress-meter https://checkip.amazonaws.com/)/32"
```

## Connect using RDP (for all EC2 instances)

* Go to the EC2 console: https://ap-northeast-1.console.aws.amazon.com/ec2/v2/home#Instances:
* Select the EC2 instance created by this CFn template
* Select "Actions" > "Connect"
* Select "RDP client"
* 
* Select "Connect using Fleet Manager"
* Click "Fleet Manager Remote Desktop"
  * Select "User credentials"
  * Enter Username: `Administrator`
  * Enter Password: 

## Set up the first Domain Controller

「ひと目でわかる Active Directory Windows Server 2022 版」の p.23

* Connect to `Domain-Controller-1` with username:`Administrator` and password:`*` (user created by AWS for `Domain-Controller-1`)
* If you see "Do you want to allow your PC...", click "Yes"
* Click the start button
* Select "Server Manager"
* Select "2 Add roles and features"
  * "Before you begin":
    * Click "Next >"
  * "Select installation type":
    * Select "Role-based or feature-based installation"
  * "Select destination server"
    * Select "Select a server from the server pool"
    * Select "EC2AMAZ-*******" (there should be only one)
    * Click "Next >"
  * "Select server roles"
    * Click "Active Directory Domain Service"
      * Click "Add Features"
    * Click "DNS Server"
      * Click "Add Features"
      * There will be a warning about static IP address, but you can ignore in this dev env (in prod env you must set up a static IP address)
      * Click "Continue"
    * Click "Next >"
  * "Select features"
    * Click "Next >"
  * "Active Directory Domain Services"
    * Click "Next >"
  * "DNS Server"
    * Click "Next >"
  * "Confirm installation selections"
    * Click "Install"
  * Wait...
  * Wait...
  * Wait...
  * After you see a message: "Installation succeeded...", click "Close"
* Select "Notification" (flag mark at upper right)
  * Click "Proomte this server to a domain controller"
    * Deployment Configuration
      * Select "Add a new forest"
      * Root domain name: `lab.example.com`
      * Click "Next >"
    * Domain Controller Options
      * Forest functional level: Windows Server 2016 (default)
      * Domain functional level: Windows Server 2016 (default)
      * Specify domain controller capabilities:
        * Check "Domain Name System (DNS) server" (default)
        * Check "Global Catalog" (default)
        * Uncheck "Read only domain controller (RODC)" (default)
      * DSRM password: `<PASSWORD_FOR_DC>`
      * Click "Next >"
    * DNS Options
      * Click "Next >"
    * Additional Options
      * Wait few seconds...
      * Click "Next >"
    * Paths
      * Click "Next >"
    * Review Options
      * Click "Next >"
    * Prerequisites Check
      * Click "Install"
  * You're about to be signed out
    * Click "Close"
    * The EC2 instance will reboot

## Add a domain admin user

* Connect to `Domain-Controller-1` with username:`Administrator` and password:`*` (user created by AWS for `Domain-Controller-1`)
* Click the start button
* Click "Windows Administrative Tools > Active Directory Users and Computers"
  * Click "lab.example.com"
  * Right click "Users"
    * Click "New > User"
      * First name: `Yohei`
      * Last name: `Tsuji`
      * Full name: `Yohei Tsuji`
      * User logon name: `tyohei`
      * Click "Next >"
      * Password: `<PASSWORD_FOR_USER>`
      * Uncheck "User must change password at the next logon"
      * Uncheck "User cannot change password" (default)
      * Check "Password never expires"
      * Uncheck "Account is disabled" (default)
      * Click "Next >"
      * Click "Finish"
  * Right click "Yohei Tsuji"
    * Click "Add to a group..."
    * Enter the object name to select: `Domain Admins`
    * Click "Check Names"
    * Click "OK"
    * Enter the object name to select: `Enterprise Admins`
    * Click "Check Names"
    * Click "OK"
    * Click "OK"

## Set up the second Domain Controller

「ひと目でわかる Active Directory Windows Server 2022 版」の p.45

* Connect to `Domain-Controller-2` with username:`Administrator` and password:`*` (user created by AWS for `Domain-Controller-2`)
* If you see "Do you want to allow your PC...", click "Yes"
* Click the start button
* Select "Server Manager"
* Select "1 Configure this local server"
  * In properties, Click "Ethernet 3"
  * Right click "Ethernet 3"
    * Click "Properties"
  * Double click "Internet Protocol Version 4 (TCP/IPv4)"
  * Select "Use the following DNS server address"
    * Preferred DNS server: `Domain-Controller-1`'s private IP address
    * Alternate DNS server: `127.0.0.1` (localhost)
    * Click "OK"
  * Click "OK"
  * Close "Network Connections"
* Select "2 Add roles and features" at the Dashboard
  * "Before you begin":
    * Click "Next >"
  * "Select installation type":
    * Select "Role-based or feature-based installation"
  * "Select destination server"
    * Select "Select a server from the server pool"
    * Select "EC2AMAZ-*******" (there should be only one)
    * Click "Next >"
  * "Select server roles"
    * Click "Active Directory Domain Service"
      * Click "Add Features"
    * Click "DNS Server"
      * Click "Add Features"
      * There will be a warning about static IP address, but you can ignore in this dev env (in prod env you must set up a static IP address)
      * Click "Continue"
    * Click "Next >"
  * "Select features"
    * Click "Next >"
  * "Active Directory Domain Services"
    * Click "Next >"
  * "DNS Server"
    * Click "Next >"
  * "Confirm installation selections"
    * Click "Install"
  * Wait...
  * Wait...
  * Wait...
  * After you see a message: "Installation succeeded...", click "Close"
* Select "Notification" (flag mark at upper right)
  * Click "Proomte this server to a domain controller"
    * Deployment Configuration
      * Select "Add a domain controller to an existing domain"
      * Domain: `lab.example.com`
      * Supply the credentials to perform this operation:
        * Click "Change..."
          * User name: `tyohei@lab.example.com`
          * Password: `<PASSWORD_FOR_USER>`
          * Click "OK"
        * Click "Next >"
    * Domain Controller Options
      * Specify domain controller capabilities:
        * Check "Domain Name System (DNS) server" (default)
        * Check "Global Catalog" (default)
        * Uncheck "Read only domain controller (RODC)" (default)
      * DSRM password: `<PASSWORD_FOR_DC>`
      * Click "Next >"
    * DNS Options
      * Click "Next >"
    * Additional Options
      * Wait few seconds...
      * Click "Next >"
    * Paths
      * Click "Next >"
    * Review Options
      * Click "Next >"
    * Prerequisites Check
      * Click "Install"
  * You're about to be signed out
    * Click "Close"
    * The EC2 instance will reboot

## Set up the child Domain Controller

「ひと目でわかる Active Directory Windows Server 2022 版」の p.35

* Connect to `Child-Domain-Controller` with username:`Administrator` and password:`*` (user created by AWS for `Child-Domain-Controller`)
* If you see "Do you want to allow your PC...", click "Yes"
* Click the start button
* Select "Server Manager"
* Select "1 Configure this local server"
  * In properties, Click "Ethernet 3"
  * Right click "Ethernet 3"
    * Click "Properties"
  * Double click "Internet Protocol Version 4 (TCP/IPv4)"
  * Select "Use the following DNS server address"
    * Preferred DNS server: `Domain-Controller-1`'s private IP address
    * Alternate DNS server: `Domain-Controller-2`'s private IP address
    * Click "OK"
  * Click "OK"
  * Close "Network Connections"
* Select "2 Add roles and features" at the Dashboard
  * "Before you begin":
    * Click "Next >"
  * "Select installation type":
    * Select "Role-based or feature-based installation"
  * "Select destination server"
    * Select "Select a server from the server pool"
    * Select "EC2AMAZ-*******" (there should be only one)
    * Click "Next >"
  * "Select server roles"
    * Click "Active Directory Domain Service"
      * Click "Add Features"
    * Click "DNS Server"
      * Click "Add Features"
      * There will be a warning about static IP address, but you can ignore in this dev env (in prod env you must set up a static IP address)
      * Click "Continue"
    * Click "Next >"
  * "Select features"
    * Click "Next >"
  * "Active Directory Domain Services"
    * Click "Next >"
  * "DNS Server"
    * Click "Next >"
  * "Confirm installation selections"
    * Click "Install"
  * Wait...
  * Wait...
  * Wait...
  * After you see a message: "Installation succeeded...", click "Close"
* Select "Notification" (flag mark at upper right)
  * Click "Proomte this server to a domain controller"
    * Deployment Configuration
      * Select "Add a new domain to an existing forest"
      * Select domain type: Child Domain
      * Parent domain name: `lab.example.com`
      * New domain name: `child`
      * Supply the credentials to perform this operation:
        * Click "Change..."
          * User name: `tyohei@lab.example.com`
          * Password: `<PASSWORD_FOR_USER>`
          * Click "OK"
        * Click "Next >"
    * Domain Controller Options
      * Specify domain controller capabilities:
        * Check "Domain Name System (DNS) server" (default)
        * Check "Global Catalog" (default)
        * Uncheck "Read only domain controller (RODC)" (default)
      * DSRM password: `<PASSWORD_FOR_DC>`
      * Click "Next >"
    * DNS Options
      * Click "Next >"
    * Additional Options
      * Wait few seconds...
      * Click "Next >"
    * Paths
      * Click "Next >"
    * Review Options
      * Click "Next >"
    * Prerequisites Check
      * Click "Install"
  * You're about to be signed out
    * Click "Close"
    * The EC2 instance will reboot

## Links

* https://dev.classmethod.jp/articles/tips-for-build-active-directory-on-ec2/
* https://zenn.dev/mn87/articles/cdade63da9f60a
* https://blogs.manageengine.jp/ou_delegation/
* https://social.technet.microsoft.com/wiki/contents/articles/52765.windows-server-2019-step-by-step-setup-active-directory-environment-using-powershell.aspx
