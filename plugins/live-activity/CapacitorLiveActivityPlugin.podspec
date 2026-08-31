Pod::Spec.new do |s|
  s.name = 'CapacitorLiveActivityPlugin'
  s.version = '1.0.0'
  s.summary = 'Native Live Activities and Dynamic Island for PC Flex'
  s.license = 'MIT'
  s.homepage = 'https://pcflex.app'
  s.author = 'PC Flex'
  s.source = { :git => '' }
  s.source_files = 'ios/Plugin/**/*.{swift,h,m}'
  s.ios.deployment_target = '16.1'
  s.dependency 'Capacitor'
  s.swift_version = '5.1'
end
