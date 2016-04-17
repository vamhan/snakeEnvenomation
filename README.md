Mobile prototype version 1.0
=====================

## Using this project

In order to install ionic, please follow this link http://ionicframework.com/docs/guide/installation.html
In order to run the app, please follow this link http://ionicframework.com/docs/guide/testing.html


## Important notes
* This prototype hasn't connected with the API yet. I just created the mockup data to test this version.
* The fully testing is only run on ios simulation --> ios version 9.2, device iPhone 6s plus (partly testing on android simulation --> Sumsung Galaxy S6 - 6.0.0 - API 23)
* It will be greatly if you can test the app on the real device. (Since I don't have Apple Developer License in order to install the native app on iPhone and I don't have any android device)
* The location permission on android is crashed (as far as I tested). So you should select deny when the location permission is prompted just for now.


## scope of version 1.0 
* #1 login page, default username is "root" (without keeping user session)
* #2 confirmation of data page (location permission is crashed on Android simulation)
* #3 page (you can click snake name for more information (which now I don't have that information yet))
    *** The process flow right now is only worked for the Russel Viper snake type, so you should select "NO" for both systemic bleeding and respiratory failure questions and select snake type as งูแมวเซา
* #4.1 blood sample page
* #5.1 process flow overview for the Russell Viper snake type
    *** In order to reduce the waiting time for the flow to move on, I reduce the time to alert from hour to second * 5
        For example, "q 6 hr for 2 times", instead of waiting for 6 hours, you will recieve the alert in just 30 seconds.
    *** Currently, the alert is just the normal alert. For future plan, it will be merged with notive mobile notification reminder funcion or something similar.
* The flow will go between #4.1 and #5.1
