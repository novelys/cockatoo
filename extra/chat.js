function getKeys(h) {
  var keys = "";
  for (var key in h)
    keys += "," + key;
  return keys.substr(1);
}

function load_friends_json() {
  $.ajax({
    cache: false,
    type: "GET",
    dataType: "json",
    url: "/profile/friends.json",
    async: false,
    //error: chat_unavailable,
    success: function(msg) {
      friends_json = msg;
    }
  });
}

function chat_init() {
  chat_initialization = true;
  chat_available();
  chat_register();
  
  $('.header', ui_chat_applet).click(function(){
	  chat_applet_toggle();
		return false;
	});
	
	$('.info', ui_chat_applet_status).click(function(){
    chat_applet_toggle();
		return false;
	});
	$(ui_chat_applet_collapsed).click(function() {
	  chat_applet_toggle();
	  return false;
	});
	$(ui_chat_applet_expanded).click(function() {
	  chat_applet_toggle();
	  return false;
	});
	// ui_chat_applet.click(function(){
    // chat_applet_focus()
	// });
}

function chat_applet_toggle() {
  chat_all_discussions_collapse();
  
  if ( ui_chat_applet_status.hasClass('is-expanded') ) {
    chat_applet_collapse();
	} else {
    chat_applet_expand();
  }
}

function chat_applet_collapse() {
  ui_chat_applet_sliding_pane.addClass('hidden');
	ui_chat_applet_collapsed.removeClass('hidden');
	ui_chat_applet_expanded.addClass('hidden');
  ui_chat_applet_status.removeClass('is-expanded');
  chat_applet_unfocus();
}

function is_all_chat_discussions_collapsed() {
  return $('.ChatLog.hidden').length == $('.ChatLog').length;
}

function chat_applet_expand() {
  ui_chat_applet_expanded.removeClass('hidden');
	ui_chat_applet_collapsed.addClass('hidden');
	ui_chat_applet_sliding_pane.removeClass('hidden');
	ui_chat_applet_status.addClass('is-expanded');
	chat_applet_focus();
}

function chat_applet_focus(){
  $('#ChatApplication .with-focus').removeClass('with-focus');
  ui_chat_applet.addClass('with-focus');
}

function chat_applet_unfocus(){
  ui_chat_applet.removeClass('with-focus');
}

function chat_discussion_toggle(nui) {
  if ($('.toggle .do-collapse', nui).hasClass('hidden')) {
    chat_discussion_expand(nui);
  } else {
    chat_discussion_collapse(nui);
  }
}

function chat_all_discussions_collapse() {
  $(".ChatLog").addClass('hidden');
  $(".ChatStatus .toggle .do-collapse").addClass('hidden');
  $(".ChatStatus .toggle .do-expand").removeClass('hidden');
}

function chat_discussion_expand(nui) {
  chat_all_discussions_collapse();
  $(".ChatLog", nui).removeClass('hidden');
  $(".toggle .do-collapse", nui).removeClass('hidden');
  $(".toggle .do-expand", nui).addClass('hidden');
  chat_applet_collapse();
  chat_scroll(nui);
  focus_on_input(nui);
}

function focus_on_input(nui) {
  $('.in-message', nui).focus();
}

function chat_discussion_collapse(nui) {
  $(".ChatLog", nui).addClass('hidden');
  $(".toggle .do-collapse", nui).addClass('hidden');
  $(".toggle .do-expand", nui).removeClass('hidden');
  chat_applet_collapse();
}

function chat_unavailable() {
  $('.when-service_available', ui_chat_applet).addClass('hidden');
	$('.DiscussionApplet', ui_chat_applets).addClass('hidden');
	$('.when-not_service_available', ui_chat_applet).removeClass('hidden');
}

function chat_available() {
  $('.when-service_available', ui_chat_applet).removeClass('hidden');
  $('.DiscussionApplet', ui_chat_applets).removeClass('hidden');
	$('.when-not_service_available', ui_chat_applet).addClass('hidden');
}

function chat_discussion_close(nui, fid) {
  nui.remove();
  
  $.ajax({
    cache: false,
    type: "GET",
    dataType: "json",
    url: "/chat/close_discussion",
    error: chat_unavailable,
    data: {uid: uid, did: fid}
  });
}

function chat_register() {
  url = "/chat/register";
  $.ajax({
    cache: false,
    type: "GET",
    dataType: "json",
    url: url,
    error: chat_unavailable,
    success: chat_dispatch_messages,
    data: {uid: uid, "friends_ids": getKeys(friends_json)}
  });
}

function chat_poll() {
  url = "/chat/poll";
  $.ajax({
    cache: false,
    type: "GET",
    dataType: "json",
    url: url,
    error: chat_unavailable,
    success: chat_dispatch_messages,
    data: {uid: uid}
  });
}

function chat_say(fid, msg) {
  url = "/chat/say";
  $.ajax({
    cache: false,
    type: "GET",
    dataType: "json",
    url: url,
    data: {sid: uid, did: fid, msg: msg}
  });
}

function chat_leave() {
  url = "/chat/leave";
  $.ajax({
    cache: false,
    type: "GET",
    dataType: "json",
    url: url,
    async: false,
    data: {uid: uid}
  });
}

function chat_dispatch_messages(messages) {
  if (messages) {
    for ( var i=0, len=messages.length; i<len; ++i ){
      message = messages[i];
      switch(message.type) {
        case "status":
          // user change his status : offline/online
          chat_user_change_status(message);
        break;
        case "message":
          // user send a message to another
          chat_incoming_message(message);
        break;
      }
    }
  }
  chat_initialization = false;
  
  setTimeout(chat_poll, 0);
}

function chat_user_change_status(friend) {
  not_existing = $('[fid='+friend.uid+']').length == 0;
  if ( not_existing && (friend.state && (friend.state == 'ONLINE')) ) {
    fui = ui_chat_applet_friend_template.clone();
    fui.attr({'fid':('' + friend.uid), 'status':friend.state});
    $('.out-name', fui).html(friends_json[friend.uid].login);
    $('.out-status', fui).html(friend.state);
    $('.out-picture', fui).attr({'title':friends_json[friend.uid].login, 'src':friends_json[friend.uid].avatar_url});
    $('.do-seeChat', fui).click(function(){
      chat_discuss_with_user(friend);
    });
    fui.removeClass('hidden');
    ui_chat_applet_friends.append(fui);
    chat_user_online(friend.uid);
  }
  if (friend.state && (friend.state == 'OFFLINE')) {
    chat_user_offline(friend.uid);
  }
  chat_applet_update_counters();
}

function chat_user_offline(uid) {
  $('[fid='+uid+']').remove();
  nui = $('[discussion_with='+uid+']');
  if (nui.length != 0) {
    $('.out-withStatus', nui).html("OFFLINE");
    $('.in-message', nui).attr("disabled", "disabled");
  }
}

function chat_user_online(uid) {
  nui = $('[discussion_with='+uid+']');
  if (nui.length != 0) {
    $('.out-withStatus', nui).html("ONLINE");
    $('.in-message', nui).removeAttr("disabled");
  }
}

function chat_scroll(nui) {
  $('.cl-body', nui).scrollTo('100%');
}

function chat_incoming_message(message) {
  var friend = null;
  if (message.sid == uid) {
    friend = {uid:message.did, state:"ONLINE"};
    message_login = user_name;
  } else {
    friend = {uid:message.sid, state:"ONLINE"};
    message_login = friends_json[friend.uid].login;
  }
  var nui = $('[discussion_with='+friend.uid+']');
  if ( nui.length == 0 ) {
    chat_discuss_with_user(friend);
    nui = $('[discussion_with='+friend.uid+']');
  }

  var chat_log = $('.ChatLog', nui);
  
  if (chat_initialization) {
    chat_discussion_collapse(nui);
  } else if (is_all_chat_discussions_collapsed()) {
    chat_discussion_expand(nui);
  }
  
  var messages = $('ul.messages', chat_log);
  chat_discussion_message_counter(nui, messages);
  
  var message_template = $('.TEMPLATES ul li', chat_log).clone();
  var date=new Date(message.date);
  var m=date.getMinutes();
  var h=date.getHours();
  $('.out.name', message_template).html(message_login);
  $('.out.text', message_template).html(message.value);
  $('.out.date', message_template).html(sprintf('%02dh%02d', h, m));
  if (message.sid == uid) {
    message_template.addClass('inbound');
  } else {
    message_template.addClass('outbound');
  }
  messages.append(message_template).removeClass('is-empty');
  
  chat_scroll(nui);
  
  // Play a sound...
  if (!chat_initialization && message.sid != uid) {
    chatAlarmSound.play();
  }
}

function chat_discuss_with_user(friend) {
  var nui = $('[discussion_with='+friend.uid+']');
  if ( nui.length == 0 ) {
    var nui = ui_chat_discussion_applet_template.clone();
    nui.attr({'discussion_with':friend.uid});
    $('.out-withName', nui).html(friends_json[friend.uid].login);
    $('.out-withStatus', nui).html(friend.state);
    $('.out-withPicture', nui).attr({'title':friends_json[friend.uid].login, 'src':friends_json[friend.uid].avatar_url});

    
    $('.ChatStatus.StatusBar', nui).click(function(){
      chat_discussion_toggle(nui);
  		return false;
  	});
    
    $('.ChatLog .header .do-collapse', nui).click(function() {
      chat_discussion_toggle(nui);
      return false;
    });
    
    $('.ChatLog .header .do-close-discussion', nui).click(function() {
      chat_discussion_close(nui, friend.uid);
      return false;
    });
    
    $(".in-message", nui).keypress(function (e) {
      if (e.keyCode != 13 /* Return */) return;
      chat_send_message(nui, friend.uid);
    });
    
    $(".do-writeMessage", nui).click(function() {
      chat_send_message(nui, friend.uid);
    });

    ui_chat_applets.append(nui);
    chat_applet_collapse();
    focus_on_input(nui);
  } else {
    chat_discussion_expand(nui);
  }
}

function chat_send_message(nui, friend_uid) {
  /*var msg = $("#entry").attr("value").replace("\n", "");*/
  var msg = $(".in-message", nui).attr("value");
  if (msg != "") {
    chat_say(friend_uid, msg);
    $(".in-message", nui).attr("value", "");
  }
}

function chat_discussion_message_counter(nui, messages) {
  nbr = $('li', messages).length;
  $('.out-messageCount', nui).html(nbr);
}

function chat_applet_update_counters() {
  nbr = $('li.friend-element[STATUS=ONLINE]', ui_chat_applet_friends).length;
  $('.out-onlineFriends', ui_chat_applet).html(nbr);
  if (nbr > 0) {
    $('.when-empty', ui_chat_applet_friends).addClass('hidden');
  } else {
    $('.when-empty', ui_chat_applet_friends).removeClass('hidden');
  }
}
  
$(window).unload(function () {
  chat_leave();
});
