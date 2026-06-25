# Changelog

## [1.2.0](https://github.com/cannicombustiva/differenziacomiso/compare/v1.1.0...v1.2.0) (2026-06-25)


### Features

* harden daily reminder cron with tested pure helpers ([#61](https://github.com/cannicombustiva/differenziacomiso/issues/61)) ([#62](https://github.com/cannicombustiva/differenziacomiso/issues/62)) ([985305d](https://github.com/cannicombustiva/differenziacomiso/commit/985305db78a2f99ec7860f2ae6745b5d649a6cb2))
* passwordless admin onboarding script ([#57](https://github.com/cannicombustiva/differenziacomiso/issues/57)) ([#66](https://github.com/cannicombustiva/differenziacomiso/issues/66)) ([23755cf](https://github.com/cannicombustiva/differenziacomiso/commit/23755cfb2faa3fb3a5b9be79070ece8e265d7ab8))
* pure login state machine for passwordless OTP ([#56](https://github.com/cannicombustiva/differenziacomiso/issues/56)) ([#65](https://github.com/cannicombustiva/differenziacomiso/issues/65)) ([eebe8c4](https://github.com/cannicombustiva/differenziacomiso/commit/eebe8c4ee071a0c5e0e2926f8aede8cbc392aa78))
* wire /admin/login onto the OTP state machine ([#67](https://github.com/cannicombustiva/differenziacomiso/issues/67)) ([#68](https://github.com/cannicombustiva/differenziacomiso/issues/68)) ([ac80dde](https://github.com/cannicombustiva/differenziacomiso/commit/ac80dde6ed0a8e7ec214d78b375a06b77fdc59c8))


### Bug Fixes

* deliver push reminders in the Android background ([#71](https://github.com/cannicombustiva/differenziacomiso/issues/71)) ([ee42549](https://github.com/cannicombustiva/differenziacomiso/commit/ee42549f5e2eab90d361d77793cf5c571f11eb12))
* use PNG for apple-touch-icon so iOS home-screen icon renders ([#74](https://github.com/cannicombustiva/differenziacomiso/issues/74)) ([31cea88](https://github.com/cannicombustiva/differenziacomiso/commit/31cea881577b6192e4df1c7e80d1258d1e3921e3))

## [1.1.0](https://github.com/cannicombustiva/differenziacomiso/compare/v1.0.0...v1.1.0) (2026-06-23)


### Features

* admin shell, login and dashboard redesign ([#50](https://github.com/cannicombustiva/differenziacomiso/issues/50)) ([5b704de](https://github.com/cannicombustiva/differenziacomiso/commit/5b704dec5449bdf800b4b74899777b31b59fcf5b))
* desktop Calendario layout (month grid + detail panel) ([#47](https://github.com/cannicombustiva/differenziacomiso/issues/47)) ([452c8b5](https://github.com/cannicombustiva/differenziacomiso/commit/452c8b53c3e9eb25fbb7a41afb200930f0af8264))
* desktop Info layout (two-column card grid) ([#48](https://github.com/cannicombustiva/differenziacomiso/issues/48)) ([b18d03e](https://github.com/cannicombustiva/differenziacomiso/commit/b18d03e72bbe54667d2a3143eb455cf77ef5245a))
* desktop layout with sidebar nav and Home dashboard ([#46](https://github.com/cannicombustiva/differenziacomiso/issues/46)) ([0356934](https://github.com/cannicombustiva/differenziacomiso/commit/0356934af4f648d91ec258fc38b0064b5e98b589))
* desktop Riciclabolario and Notizie layouts ([#49](https://github.com/cannicombustiva/differenziacomiso/issues/49)) ([0d90153](https://github.com/cannicombustiva/differenziacomiso/commit/0d90153e43715f019861443236a30ea5e3842abe))
* redesign admin Notizie and Notifiche managers ([#51](https://github.com/cannicombustiva/differenziacomiso/issues/51)) ([479ae32](https://github.com/cannicombustiva/differenziacomiso/commit/479ae323fb6b0b7fd9dd28e4895cf79d66fb5121))
* redesign admin Riciclabolario (master-detail) and restyle Calendario ([#52](https://github.com/cannicombustiva/differenziacomiso/issues/52)) ([da8dea2](https://github.com/cannicombustiva/differenziacomiso/commit/da8dea2b3ed57bc00dd0cf293f99324c3fc28b8d))
* refresh Calendario with new design system ([#43](https://github.com/cannicombustiva/differenziacomiso/issues/43)) ([f70d033](https://github.com/cannicombustiva/differenziacomiso/commit/f70d0335b1a73fd58693efe942c20e65d224bbf9))
* refresh Home with new design system (tokens, WasteCard, agenda) ([#42](https://github.com/cannicombustiva/differenziacomiso/issues/42)) ([872182d](https://github.com/cannicombustiva/differenziacomiso/commit/872182d176b468c87908c35ab03d179f8b14a245))
* refresh Notizie and Info with new design system ([#45](https://github.com/cannicombustiva/differenziacomiso/issues/45)) ([759f9fe](https://github.com/cannicombustiva/differenziacomiso/commit/759f9fead0504193a8db4de96aa54690886a6e5b))
* refresh Riciclabolario with new design system ([#44](https://github.com/cannicombustiva/differenziacomiso/issues/44)) ([561363b](https://github.com/cannicombustiva/differenziacomiso/commit/561363b4f7d57702a2da39edf44ddea213c939e6))


### Bug Fixes

* show real app version on /info instead of hardcoded value ([#40](https://github.com/cannicombustiva/differenziacomiso/issues/40)) ([ae61ab4](https://github.com/cannicombustiva/differenziacomiso/commit/ae61ab4d6b7bfb9148a16979ad0909e9bee39a5c))

## 1.0.0 (2026-06-21)


### Features

* accent-fold Riciclabolario search over names and tips ([#16](https://github.com/cannicombustiva/differenziacomiso/issues/16)) ([#28](https://github.com/cannicombustiva/differenziacomiso/issues/28)) ([695069a](https://github.com/cannicombustiva/differenziacomiso/commit/695069ab58cd2f8e9ede87c98b1915d8542ad199))
* add Recupero note read path with single grouping transform ([#22](https://github.com/cannicombustiva/differenziacomiso/issues/22)) ([#27](https://github.com/cannicombustiva/differenziacomiso/issues/27)) ([27abfdf](https://github.com/cannicombustiva/differenziacomiso/commit/27abfdf17704751e56deb3154396d3d3c052b117))
* adds theme switcher and improves styling ([22b7b91](https://github.com/cannicombustiva/differenziacomiso/commit/22b7b915a0694599cf5995552f61d29bfcb533ed))
* adds theme switcher and improves styling ([731b5bd](https://github.com/cannicombustiva/differenziacomiso/commit/731b5bd344c6fc61b6c1379526756d8e8f35f2b8))
* admin per-date Pickup note editing ([#23](https://github.com/cannicombustiva/differenziacomiso/issues/23)) ([#31](https://github.com/cannicombustiva/differenziacomiso/issues/31)) ([f45cd20](https://github.com/cannicombustiva/differenziacomiso/commit/f45cd207ef463ff83f5f7d1e4308d30776b8d871))
* anchor Reference day to Europe/Rome ([#19](https://github.com/cannicombustiva/differenziacomiso/issues/19)) ([#24](https://github.com/cannicombustiva/differenziacomiso/issues/24)) ([2605331](https://github.com/cannicombustiva/differenziacomiso/commit/260533117f14f666af95136ac98ef5642d1e37b0))
* cron push notification ([a4ad9dd](https://github.com/cannicombustiva/differenziacomiso/commit/a4ad9ddb35aadd30c38db60dd2081db0b0d41e84))
* deliberate offline cache and freshness banner ([#17](https://github.com/cannicombustiva/differenziacomiso/issues/17)) ([#32](https://github.com/cannicombustiva/differenziacomiso/issues/32)) ([7cd3c3e](https://github.com/cannicombustiva/differenziacomiso/commit/7cd3c3efb128cd835d927fc9ab28a987ab60da83))
* enables linting, husky, and pnpm workflow ([2e6910e](https://github.com/cannicombustiva/differenziacomiso/commit/2e6910ec6914577a9aff276e42c798f40177a711))
* regenerate 2026 seed from the rule + Apr 30 Exception ([#21](https://github.com/cannicombustiva/differenziacomiso/issues/21)) ([#33](https://github.com/cannicombustiva/differenziacomiso/issues/33)) ([8398c77](https://github.com/cannicombustiva/differenziacomiso/commit/8398c77835d3888223f7c221434e8204765171ea))
* relabel admin subscriber count to 'dispositivi iscritti' ([#13](https://github.com/cannicombustiva/differenziacomiso/issues/13)) ([#29](https://github.com/cannicombustiva/differenziacomiso/issues/29)) ([cfe86e5](https://github.com/cannicombustiva/differenziacomiso/commit/cfe86e5cc1405c42575527e8c08007c0d66b3925))
* single Settimana Tipo rule with 5th-Thursday gap ([#20](https://github.com/cannicombustiva/differenziacomiso/issues/20)) ([#26](https://github.com/cannicombustiva/differenziacomiso/issues/26)) ([8c05ec8](https://github.com/cannicombustiva/differenziacomiso/commit/8c05ec882f72a8103ccba5bc9571f894c3faa10d))
* supabase update ([#6](https://github.com/cannicombustiva/differenziacomiso/issues/6)) ([97c6016](https://github.com/cannicombustiva/differenziacomiso/commit/97c6016e36c33383a7cdeac49a72930fc00737a5))


### Bug Fixes

* gate DB writes on admins membership; lock push_subscriptions ([#11](https://github.com/cannicombustiva/differenziacomiso/issues/11), [#12](https://github.com/cannicombustiva/differenziacomiso/issues/12)) ([#30](https://github.com/cannicombustiva/differenziacomiso/issues/30)) ([4c82e9f](https://github.com/cannicombustiva/differenziacomiso/commit/4c82e9f89c21dd53c094a2d81159c95ea4847ab3))
