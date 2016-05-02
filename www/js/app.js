// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'


angular.module('snakeEnvenomation', ['ionic', 'snakeEnvenomation.controllers', 'snakeEnvenomation.services'])

    .run(function($ionicPlatform) {
        $ionicPlatform.ready(function() {
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
        });
    })

    .config(function($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('signin', {
                url: '/sign-in',
                templateUrl: 'sign-in.html',
                controller: 'SignInCtrl'
            })
            .state('record', {
                url: '/record',
                templateUrl: 'templates/record.html',
                controller: 'RecordCtrl'
            })
            .state('patientPUtil', {
                url: '/patientPUtil',
                templateUrl: 'templates/patientPUtil.html',
                controller: 'PatientPUtilCtrl'
            })
            .state('bloodSample', {
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
                controller: 'bloodResultCtrl'
            })
            .state('bloodResult', {
                url: '/hematotoxic/bloodResult',
                templateUrl: 'templates/hematotoxic/bloodResult.html',
                controller: 'bloodResultCtrl',
                params: {
                    'index': null
                }
            })
            .state('motorWeakness', {
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
            .state('umanagement', {
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



        $urlRouterProvider.otherwise('/sign-in');

    })

