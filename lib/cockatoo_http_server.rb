require 'eventmachine'
require 'cgi'
require 'yajl'
require "htmlentities"

class Object
  def blank?
    respond_to?(:empty?) ? empty? : !self
  end

  def present?
    !blank?
  end
end

class ChatUser
  attr_accessor :uid, :discussion, :friends_ids
  def self.new_from_query(query)
    return nil unless query.present? && query['uid'].present?
    new(:uid => query['uid'].first.to_i)
  end
  
  def initialize(attributes)
    @uid = attributes[:uid]
    @friends_ids = []
  end
  
  def log_with_user(other_chat_user)
    self.discussion.present? ? self.discussion.log.select { |message| message["type"] == "message" && (message["sid"] == other_chat_user.uid || message["did"] == other_chat_user.uid) } : []
  end
  
  def clear_discussion(did)
    if self.discussion.present?
      self.discussion.log.delete_if { |message| message["sid"] == did || message["did"] == did }
    end
  end
end

class Discussion < EM::Channel
  attr_accessor :log
  
  def initialize
    @log = []
    super()
  end

  def say(ary)
    ary = [ ary ].flatten
    @log = (@log + ary)[0, 500]
    json = Yajl::Encoder.encode(ary)
    push json
  end
end

module ChatHttpServer

  def unbind
    $chat_users[@user_id].discussion.unsubscribe(@sid) if @user_id && @sid && $chat_users[@user_id] && $chat_users[@user_id].discussion
  end

  def receive_data(data)
    # puts "received data : #{data}"
    lines = data.split(/[\r\n]+/)
    method, request, version = lines.shift.split(' ', 3)
    if request.nil?
      $logger.error "#{Time.now} Warning: strange request #{[method, request, version].inspect}"
      close_connection
      return
    else
      path, query = request.split('?', 2)
      $logger.info "#{Time.now} request on #{path} with #{query}"
      query = CGI.parse(query) if not query.nil?
      cookies = {}
      lines.each do |line|
        if line[0..6].downcase == 'cookie:'
          cookies = CGI::Cookie.parse(line.split(':', 2).last.strip)
        end
      end
    end
   
    if query.present? && query['uid'].present?
      uid = query['uid'].first.to_i
      chat_user = ($chat_users[uid] ||= ChatUser.new_from_query(query))
    end
    
    case path

    when '/chat/register'
      if chat_user && query['friends_ids'].present? && query['friends_ids'].first.present?
        remove_all_timers_for(chat_user)
        
        chat_user.friends_ids = query["friends_ids"].first.split(',').map { |id| id.to_i }
        
        message = { "type" => "status", "state" => "ONLINE", "uid" => chat_user.uid }
        back_messages = []
        chat_user.friends_ids.each do |fid|
          chat_user_friend = $chat_users[fid]
          if chat_user_friend && chat_user_friend.discussion
            chat_user_friend.discussion.say(message)
            back_messages << {"type" => "status", "state" => "ONLINE", "uid" => fid}

            back_messages += chat_user.discussion ? chat_user.log_with_user(chat_user_friend) : chat_user_friend.log_with_user(chat_user)
          end
        end
        respond Yajl::Encoder.encode(back_messages)
      else
        respond "no user id or no friends ids", 500
      end

    when '/chat/leave'
      if chat_user
        empty_response
        unregister_user_after(chat_user, 15)
      else
        respond "no user id", 500
      end
      
    when '/chat/close_discussion'
      empty_response
      
      if chat_user && query['did'].present?
        did = query['did'].first.to_i
        $logger.info "User #{chat_user.uid} clears discussion for user #{did}"
        chat_user.clear_discussion(did)
      end

    when '/chat/poll'
      if chat_user
        unregister_user_after(chat_user, 120)
        timer = EventMachine::Timer.new(30) do
          empty_response
        end
        @user_id = chat_user.uid
        chat_user.discussion ||= Discussion.new
        @sid = chat_user.discussion.subscribe do |code|
          respond code
        end
      else
        respond "no user id", 500
      end

    when '/chat/say'
      if query['sid'].present? and query['msg'].present? and query['did'].present?
        empty_response
        sid = query['sid'].first.to_i
        did = query['did'].first.to_i
        msg = query['msg'].first
        
        chat_user_sender = $chat_users[sid]
        chat_user_recipient = $chat_users[did]
        message = {"type" => "message", "value" => HTMLEntities.new.encode(msg.gsub('"', '\"')), "sid" => sid, "did" => did, "date" => (Time.now.to_i * 1000)}
        
        if chat_user_sender && chat_user_recipient
          chat_user_sender.discussion.say(message)
          chat_user_recipient.discussion.say(message)
        else
          $logger.error "#{Time.now} ERROR : message could not be transmitted between sid #{sid} and did #{did}!"
        end
      else
        respond "USER and MSG parameters are mandatory", 500
      end

    else
      respond "not found", 404
    end
  end

  RESPONSE = [
    "HTTP/1.1 %d Cockatoo Alpha 1",
    "Content-length: %d",
    "Content-type: %s",
    "Connection: close",
    "",
    "%s"].join("\r\n")
    
  def empty_response
    respond Yajl::Encoder.encode([])
  end

  def respond(body, status = 200, content_type = 'application/json; charset=utf-8')
    send_data RESPONSE % [status, body.length, content_type, body]
    close_connection_after_writing
  end
  
  def unregister_user_after(chat_user, seconds)
    remove_all_timers_for(chat_user)
    $logger.info "INFO : new timer for unregister user #{chat_user.uid} in #{seconds} sec."
    $timers[chat_user.uid] = EventMachine::Timer.new(seconds) do
      $logger.info "INFO : execute timer for user #{chat_user.uid}"
      message = { "type" => "status", "state" => "OFFLINE", "uid" => chat_user.uid }
      chat_user.friends_ids.each{|fid|
        $chat_users[fid].discussion.say(message) if $chat_users[fid] && $chat_users[fid].discussion
      }
      $chat_users.delete(chat_user.uid)
    end
  end
  
  def remove_all_timers_for(chat_user)
    if $timers[chat_user.uid]
      $logger.info "INFO : Removes timer for user #{chat_user.uid}"
      $timers[chat_user.uid].cancel
      $timers.delete(chat_user.uid)
    end
  end
end
