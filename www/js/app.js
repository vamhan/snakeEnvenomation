// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'


angular.module('snakeEnvenomation', ['ionic', 'snakeEnvenomation.controllers', 'snakeEnvenomation.services', 'ngCookies'])

    .run(function ($ionicPlatform, $cookies, $rootScope, $ionicModal) {
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

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
            var userCookie = $cookies.get('user');
            if (toState.authRequired && userCookie == null) {
                $ionicModal.fromTemplateUrl('templates/account/sign-in.html', {
                    
                }).then(function(modal) {
                    modal.show()
                });
            }
        });
    })

    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('activateAccount', {
                url: '/activateAccount/:user_id',
                templateUrl: "templates/account/activateAccount.html",
                controller: 'ActivateAccountCtrl',
                authRequired: false
            })
            .state('record', {
                cache: false,
                url: '/record',
                templateUrl: 'templates/record.html',
                controller: 'RecordCtrl',
                authRequired: true,
                params: {
                    'isNew': true
                }
            })
            .state('patientPUtil', {
                cache: false,
                url: '/patientPUtil',
                templateUrl: 'templates/patientPUtil.html',
                controller: 'PatientPUtilCtrl',
                authRequired: true,
                params: {
                    'totest': null
                }
            })
            .state('bloodSample', {
                cache: false,
                url: '/hematotoxic/bloodSample',
                templateUrl: 'templates/hematotoxic/bloodSample.html',
                controller: 'BloodSampleCtrl',
                authRequired: true,
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
                authRequired: true,
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
                controller: 'bloodResultListCtrl',
                authRequired: true
            })
            .state('bloodResult', {
                url: '/hematotoxic/bloodResult',
                templateUrl: 'templates/hematotoxic/bloodResult.html',
                controller: 'bloodResultCtrl',
                authRequired: true,
                params: {
                    'data': null
                }
            })
            .state('motorWeakness', {
                cache: false,
                url: '/neurotoxic/motorWeakness',
                templateUrl: 'templates/neurotoxic/motorWeakness.html',
                controller: 'MotorWeaknessCtrl',
                authRequired: true,
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
                authRequired: true,
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
                controller: 'WeaknessResultCtrl',
                authRequired: true
            })
            .state('unknownTest', {
                cache: false,
                url: '/unknown/unknownTest',
                templateUrl: 'templates/unknown/unknownTest.html',
                controller: 'UnknownTestCtrl',
                authRequired: true,
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
                controller: 'IdentificationCtrl',
                authRequired: true
            })
            .state('umanagement', {
                cache: false,
                url: '/unknown/management',
                templateUrl: 'templates/unknown/management.html',
                controller: 'UManagementCtrl',
                authRequired: true,
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
                authRequired: true,
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
                authRequired: true,
                params: {
                    'type': null
                }
            })



        $urlRouterProvider.otherwise('/record');

    });