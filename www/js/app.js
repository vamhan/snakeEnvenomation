// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'


angular.module('snakeEnvenomation', ['ionic', 'snakeEnvenomation.controllers', 'snakeEnvenomation.services'])

    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
            /*if(device.platform === "iOS") {
                window.plugin.notification.local.registerPermission();
            }*/
            if (window.cordova && window.cordova.plugins.Keyboard) {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                // Don't remove this line unless you know what you are doing. It stops the viewport
                // from snapping when text inputs are focused. Ionic handles this internally for
                // a much nicer keyboard experience.
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
            
            //cordova.plugins.notification.local.cancelAll();
        });
    })

    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('signin', {
                url: '/sign-in',
                templateUrl: "sign-in.html"
            })
            .state('record', {
                cache: false,
                url: '/record',
                templateUrl: 'templates/record.html',
                controller: 'RecordCtrl'
            })
            .state('patientPUtil', {
                cache: false,
                url: '/patientPUtil',
                templateUrl: 'templates/patientPUtil.html',
                controller: 'PatientPUtilCtrl',
                params: {
                    'totest': null
                }
            })
            .state('bloodSample', {
                cache: false,
                url: '/hematotoxic/bloodSample',
                templateUrl: 'templates/hematotoxic/bloodSample.html',
                controller: 'BloodSampleCtrl',
                params: {
                    'snake': null,
                    'stage': null,
                    'record': null,
                    'times': null
                }
            })
            .state('hmanagement', {
                cache: false,
                url: '/hematotoxic/management',
                templateUrl: 'templates/hematotoxic/management.html',
                controller: 'HManagementCtrl',
                params: {
                    'snake': null,
                    'stage': null,
                    'record': null,
                    'times': null
                }
            })
            .state('bloodResultList', {
                url: '/hematotoxic/bloodResultList',
                templateUrl: 'templates/hematotoxic/bloodResultList.html',
                controller: 'bloodResultListCtrl'
            })
            .state('bloodResult', {
                url: '/hematotoxic/bloodResult',
                templateUrl: 'templates/hematotoxic/bloodResult.html',
                controller: 'bloodResultCtrl',
                params: {
                    'data': null
                }
            })
            .state('motorWeakness', {
                cache: false,
                url: '/neurotoxic/motorWeakness',
                templateUrl: 'templates/neurotoxic/motorWeakness.html',
                controller: 'MotorWeaknessCtrl',
                params: {
                    'snake': null,
                    'stage': null,
                    'record': null,
                    'times': null
                }
            })
            .state('nmanagement', {
                cache: false,
                url: '/neurotoxic/management',
                templateUrl: 'templates/neurotoxic/management.html',
                controller: 'NManagementCtrl',
                params: {
                    'snake': null,
                    'stage': null,
                    'record': null,
                    'times': null
                }
            })
            .state('weaknessResultList', {
                url: '/neurotoxic/weaknessResultList',
                templateUrl: 'templates/neurotoxic/weaknessResultList.html',
                controller: 'WeaknessResultCtrl'
            })
            .state('unknownTest', {
                cache: false,
                url: '/unknown/unknownTest',
                templateUrl: 'templates/unknown/unknownTest.html',
                controller: 'UnknownTestCtrl',
                params: {
                    'snake': null,
                    'stage': null,
                    'record': null,
                    'times': null
                }
            })
            .state('identification', {
                cache: false,
                url: '/unknown/identification',
                templateUrl: 'templates/unknown/identification.html',
                controller: 'IdentificationCtrl'
            })
            .state('umanagement', {
                cache: false,
                url: '/unknown/management',
                templateUrl: 'templates/unknown/management.html',
                controller: 'UManagementCtrl',
                params: {
                    'snake': null,
                    'stage': null,
                    'record': null,
                    'times': null
                }
            })
            .state('flowchart', {
                cache: false,
                url: '/flowchart',
                templateUrl: 'templates/flowchart.html',
                controller: 'FlowchartCtrl',
                params: {
                    'snake': null,
                    'stage': null
                }
            })
            .state('generalInfo', {
                cache: false,
                url: '/generalInfo',
                templateUrl: 'templates/generalInfo.html',
                controller: 'GeneralInfoCtrl',
                params: {
                    'type': null
                }
            })



        $urlRouterProvider.otherwise('/sign-in');

    });