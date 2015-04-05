# 简介
这里我们有两个项目：
1. a-plus，在根目录下，是a-plus整体解决方案在meteor环境下的分支。我们的目的就是要完善它，使其能够和Meteor集成，形成一个简单、健壮、优雅的Web SPA开发解决方案。基本的思路是：仅仅使用Meteor的collection，完成数据（model）的reactive前后端同步，而用a+提供SPA的状态管理、数据和试图的reactive绑定。
2. meteor-testing：测试项目，这里借用了已有的a-plus-mobile-web，将其后端置换成为Meteor
详情参考：http://my.ss.sysu.edu.cn/wiki/pages/viewpage.action?pageId=392593409

# 安装说明
git clone git@222.200.181.218:rc-front/a-plus.git
git checkout a-plus-meteor
npm install
ln -s [bin目录在本地的绝对路径] /meteor-testing/packages/ericwangqing:a-plus

开始开发（测试）
grunt watch
cd meteor-testing
meteor
