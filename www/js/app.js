// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('snakeEnvenomation', ['ionic'])

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
                templateUrl: 'record.html',
                controller: 'RecordCtrl'
            })
            .state('patientPUtil', {
                url: '/patientPUtil',
                templateUrl: 'patientPUtil.html',
                controller: 'PatientPUtilCtrl'
            });



        $urlRouterProvider.otherwise('/sign-in');

    })

    .controller('SignInCtrl', function($scope, $state) {
        $scope.login = function(user, patient) {
            $state.go('record');
        };
    })

    .controller('RecordCtrl', function($scope, $state) {
        $scope.confirm = function(user, patient, incident) {
            $state.go('patientPUtil');
        };
    })
    
    .controller('PatientPUtilCtrl', function($scope, $state) {
        $scope.y_class = "button-dark";
        $scope.n_class = "button-dark";
        $scope.toggleYesSelection = function() {
            if ($scope.y_class == "button-dark") {
                $scope.y_class = "button-positive";
                $scope.n_class = "button-dark";
            } else {
                $scope.y_class = "button-dark";
                $scope.n_class = "button-positive";
            }
        };
    })
