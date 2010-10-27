require File.join(File.expand_path(File.dirname(__FILE__) + "/cockatoo_http_server"))
require 'log4r'
include Log4r

$logger = Logger.new 'cockatoo'
$logger.outputters = Outputter.stdout


loop do
  begin
    GC.start
    $chat_users = {}
    $timers = {}
    EM.epoll if EM.epoll?
    EM.run do
      $logger.info "#{Time.now} Starting server on port #{ARGV.first || 8000}"
      EM.start_server '0.0.0.0', ARGV.first || 8000, ChatHttpServer
    end
  rescue Interrupt
    $logger.info "#{Time.now} Shuting down..."
    exit
  rescue
    $logger.error "#{Time.now} Error: " + $!.message
    $logger.error "\t" + $!.backtrace.join("\n\t")
  end
end
