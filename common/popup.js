
var Global = {

  initFireBaseAPI: function() {
    var config = {
      apiKey: "AIzaSyCCYDtMdiCiJIB_1WPGr7oqXpKpe-AA6jA",
      authDomain: "playpeer-e8ab3.firebaseapp.com",
      databaseURL: "https://playpeer-e8ab3.firebaseio.com"
    };
    firebase.initializeApp(config);
    firebase.auth().signInAnonymously();
  }
};

var Storage = {

    init: function() {

        $('#playlist-set').click(function(event) {
            Storage.SetPlaylist();
            Control.next();
        });
        $('#name-set').click(function(event) {
            Storage.SetName();
        });

        if (!kango.storage.getItem("last")){
          kango.storage.setItem("last", {});
        }
    },

    SetPlaylist: function() {
        kango.storage.setItem('playlist', $('#playlist').val());
    },

    SetName: function() {
        kango.storage.setItem('name', $('#name').val());
    }
};

var Control = {

    init: function(){
        $('#playlist-next').click(function(event) {
            Control.next();
        });

        $('#playlist-push').click(function(event) {
            Control.push();
        });

        $('#playlist-download').click(function(event) {
            Control.downloadHistory();
        });
    },

    downloadHistory: function(){
        $("#media").hide();
        playlist = kango.storage.getItem('playlist');
        ref = firebase.database().ref('playlists/' + playlist);
        query = ref.orderByChild('time');
        var html = "";
        query.once("value", function(data) {
          data.forEach(function(child) {
            item = child.val();
            if (item.type == "yt"){
              setYtFrame(item);
              $("#playOn").remove();
              html += $("#media").html();
            }
          });
          enc = encodeURIComponent(html);
          var link = document.createElement('a');
          link.setAttribute('download', "history.html");
          link.setAttribute('href', 'data:text/html;charset=utf-8,' + enc);
          link.click();
        });
    },

    next: function() {
        playlist = kango.storage.getItem('playlist');
        ref = firebase.database().ref('playlists/' + playlist);
        last = kango.storage.getItem("last");

        skip_one = false;
        if (!last[playlist]){
          query = ref.orderByChild('time').limitToFirst(1);
        }else{
          query = ref.orderByChild('time').startAt(last[playlist].time).limitToFirst(2);
          skip_one = true;
        }
        query.once("value", function(data) {
          data.forEach(function(child) {
            if (skip_one){
              skip_one = false;
              return;
            }
            item = child.val();
            last[playlist] = item;
            kango.storage.setItem("last", last);
            if (item.type == "yt"){
              setYtFrame(item);
            }
          });
        });
    },

    push: function() {
      ref = firebase.database().ref('playlists/' + kango.storage.getItem('playlist')).push();
      var re = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?[\w\?=]*)?/;
      str = $('#playlist-submit').val();
      m = str.match(re);
      if (!m){
        return;
      }
      ref.set({
        id : m[1],
        from: kango.storage.getItem('name'),
        time: firebase.database.ServerValue.TIMESTAMP,
        type: "yt"
      });
    }
};

function setYtFrame(item) {
    var d = new Date(item.time);

    $('#from').text("Shared by " + item.from + " on " + d.getFullYear() +
    "/" + d.getMonth() + "/" + d.getDate());

    $('#playOn').text("Play on youtube");
    $('#playOn').off("click");
    $('#playOn').click(function(e){
      kango.browser.tabs.create({url: "https://www.youtube.com/watch?v=" + item.id});
    });
    $('.yt iframe').remove();
    $('<iframe width="427" height="240" frameborder="0" allowfullscreen></iframe>')
        .attr("src", "https://youtube.com/embed/" + item.id).appendTo(".yt");
}

KangoAPI.onReady(function() {

    Global.initFireBaseAPI();

    $('#playlist').val(kango.storage.getItem('playlist') || '');
    $('#name').val(kango.storage.getItem('name') || '');

    Storage.init();
    Control.init();

    last = kango.storage.getItem("last");
    pl = kango.storage.getItem("playlist");
    if(last && pl && last[pl]){
        setYtFrame(last[pl]);
    }
});
