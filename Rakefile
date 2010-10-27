require 'echoe'  
Echoe.new('cockatoo', '0.0.1') do |p|
  p.summary        = "Cockatoo is a simple chat server"
  p.description    = "Cockatoo is a simple chat server coded with EventMachine and using the Long Polling technique"
  p.url            = "http://github.com/novelys/cockatoo"
  p.author         = "Yann Klis"
  p.email          = "yann.klis @nospam@ novelys.com"
  p.ignore_pattern = ["tmp/*", "log/*"]
  p.development_dependencies = []
  p.runtime_dependencies = ["daemons >=1.1.0", "log4r >=1.1.8", "eventmachine >=0.12.10", "yajl-ruby >=0.7.0", "htmlentities >=4.2.1"]
  p.executable_pattern = ["bin/*"]
end
