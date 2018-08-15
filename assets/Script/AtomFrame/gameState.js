
var GameState = {
    default:0,
    logo:1,
    login:2,
    hall:3,
    room:4
}

var GameIngState = {
    default:0,
    start:1,
    pause:2,
    gameing:3,
    gamestop:4,
    gameover:5
}

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "gameState",
    },

    ctor: function () {
        console.log("-new:" + this.TAG);
        this.gameState = GameState.default;
        this.gameIngState = GameIngState.default;
    },

    onLoad: function () {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function () {
        console.log("-destory:" + this.TAG);
    },

    //
    setGameInLogo: function () {
        this.gameState = GameState.logo;
    },

    isGameInLogo: function () {
        return this.gameState == GameState.logo;
    },

    setGameInLogin: function () {
        this.gameState = GameState.login;
    },

    isGameInLogin: function () {
        return this.gameState == GameState.login;
    },

    setGameInHall: function () {
        this.gameState = GameState.hall;
    },

    isGameInHall: function () {
        return this.gameState == GameState.hall;
    },

    setGameInRoom: function () {
        this.gameState = GameState.room;
    },

    isGameInRoom: function () {
        return this.gameState == GameState.room;       
    },

    //游戏中状态
    setGameStart: function () {
        this.gameIngState = GameIngState.start;
    },

    isGameStart: function () {
        return this.gameIngState == GameIngState.start;       
    },

    setGamePause: function () {
        this.gameIngState = GameIngState.pause;
    },

    isGamePause: function () {
        return this.gameIngState == GameIngState.pause;       
    },

    setGameStop: function () {
        this.gameIngState = GameIngState.gamestop;
    },

    isGameStop: function () {
        return this.gameIngState == GameIngState.gamestop;       
    },

    setGameIng: function () {
        this.gameIngState = GameIngState.gameing;
    },

    isGameIng: function () {
        return this.gameIngState == GameIngState.gameing;       
    },

    setGameOver: function () {
        this.gameIngState = GameIngState.gameover;
    },

    isGameOver: function () {
        return this.gameIngState == GameIngState.gameover;       
    },

});
