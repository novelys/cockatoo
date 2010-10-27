# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = %q{cockatoo}
  s.version = "0.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 1.2") if s.respond_to? :required_rubygems_version=
  s.authors = ["Yann Klis"]
  s.date = %q{2010-10-27}
  s.default_executable = %q{cockatoo}
  s.description = %q{Cockatoo is a simple chat server coded with EventMachine and using the Long Polling technique}
  s.email = %q{yann.klis @nospam@ novelys.com}
  s.executables = ["cockatoo"]
  s.extra_rdoc_files = ["LICENSE", "README.rdoc", "bin/cockatoo", "extra/_chat.html.haml", "extra/_chat_initialization.html.haml", "extra/chat.css", "extra/chat.js", "lib/cockatoo_daemon.rb", "lib/cockatoo_http_server.rb"]
  s.files = ["LICENSE", "Manifest", "README.rdoc", "Rakefile", "bin/cockatoo", "cockatoo.gemspec", "extra/_chat.html.haml", "extra/_chat_initialization.html.haml", "extra/chat.css", "extra/chat.js", "lib/cockatoo_daemon.rb", "lib/cockatoo_http_server.rb"]
  s.homepage = %q{http://github.com/novelys/cockatoo}
  s.rdoc_options = ["--line-numbers", "--inline-source", "--title", "Cockatoo", "--main", "README.rdoc"]
  s.require_paths = ["lib"]
  s.rubyforge_project = %q{cockatoo}
  s.rubygems_version = %q{1.3.7}
  s.summary = %q{Cockatoo is a simple chat server}

  if s.respond_to? :specification_version then
    current_version = Gem::Specification::CURRENT_SPECIFICATION_VERSION
    s.specification_version = 3

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<daemons>, [">= 1.1.0"])
      s.add_runtime_dependency(%q<log4r>, [">= 1.1.8"])
      s.add_runtime_dependency(%q<eventmachine>, [">= 0.12.10"])
      s.add_runtime_dependency(%q<yajl-ruby>, [">= 0.7.0"])
      s.add_runtime_dependency(%q<htmlentities>, [">= 4.2.1"])
    else
      s.add_dependency(%q<daemons>, [">= 1.1.0"])
      s.add_dependency(%q<log4r>, [">= 1.1.8"])
      s.add_dependency(%q<eventmachine>, [">= 0.12.10"])
      s.add_dependency(%q<yajl-ruby>, [">= 0.7.0"])
      s.add_dependency(%q<htmlentities>, [">= 4.2.1"])
    end
  else
    s.add_dependency(%q<daemons>, [">= 1.1.0"])
    s.add_dependency(%q<log4r>, [">= 1.1.8"])
    s.add_dependency(%q<eventmachine>, [">= 0.12.10"])
    s.add_dependency(%q<yajl-ruby>, [">= 0.7.0"])
    s.add_dependency(%q<htmlentities>, [">= 4.2.1"])
  end
end
