import React, {Component} from 'react';
import './App.less';
import {Menu, Dropdown, Icon, Switch, Tabs, Button, AutoComplete, message} from 'antd';
const TabPane = Tabs.TabPane;
const ButtonGroup = Button.Group;
const GithubHost = 'https://github.com'
const GithubApiHost = 'https://api.github.com'
const client_id = 'client_id=1b847c10864b9d86fe24'
const client_secret = 'client_secret=ee2975df30bbe5bc1bfa169299fd12cac881065b'
const appOAuth = '?' + client_id + '&' + client_secret
var base64 = require('base-64');
var utf8 = require('utf8');
var ReactMarkdown = require('react-markdown');
class App extends Component {
    constructor() {
        super();
        this.state = {
            userInfo: undefined,//current user's info
            loggedUserInfo: undefined,//current user's info
            showUserInfoMenu: false,
            repos: [],//repos of current user
            enableForks: false,//show or hide current user's forked repos
            panes: [],//opened panes & dataSource of Tabs
            activeKey: undefined,//current active pane
            contributors: [],//contributors of current selected repo
            searchHistory: [],//successfully serched github usernames
            readme: "",
            access_token: undefined,//current access_token for api calling
            loginLoading: undefined,//is login status
        }
        message.config({
            duration: 1.5
        })
    }


    goToGithub() {//go to current user's github website
        if (this.state.userInfo) {
            this.goToGithubUser(this.state.userInfo)
        }
    }

    goToGithubUser(user) {//go to specific user's github website
        if (user && user.html_url) {
            window.open(user.html_url);
        }
    }

    getUserInfo(user, login) {//get userinfo for specific user, also repos if the user exists
        // console.log('getUserInfo', user)
        if (user) {
            let context = this;
            fetch(GithubApiHost + '/users/' + user + appOAuth, {
                method: 'GET'
            }).then(function (res) {
                res.json().then(function (json) {
                    // console.log('getUserInfo', json)
                    let searchH = context.state.searchHistory;
                    if (!searchH.some(function (item) {
                            return item == user
                        })) {
                        searchH.push(user)
                    }
                    if (login) {
                        context.state.loggedUserInfo = json
                    }
                    context.setState({
                        searchHistory: searchH,
                        userInfo: json,
                        repos: [],
                        panes: [],
                        activeKey: undefined,
                        contributors: []
                    })
                    context.getUserRepos(json.repos_url)
                })
            }).catch(function (error) {
                console.log(error)
            });
        }
    }

    getUserRepos(url) {//get repos of user with url
        let context = this;
        fetch(url + appOAuth, {
            method: 'GET'
        }).then(function (res) {
            res.json().then(function (json) {
                // console.log(json)
                context.state.repos = json;
                context.setState(context.state.repos)
            })
        }).catch(function (error) {
            console.log(error)
        });
    }

    getRepoContributors(url) {//get contributors with url
        let context = this;
        if (url) {
            fetch(url + appOAuth, {
                method: 'GET'
            }).then(function (res) {
                if (res.status == 200) {
                    res.json().then(function (json) {
                        context.setState({contributors: json})
                    })
                } else {
                    context.setState({contributors: []})
                }
            }).catch(function (error) {
                console.log('getRepoContributors error:', error)
                context.setState({contributors: []})
            });
        } else {
            context.setState({contributors: []})
        }
        // context.getRepoReadme("https://api.github.com/repos/git/git/contents/readme.md")
    }

    getRepoReadme(url) {//get readme with url
        let context = this;
        fetch(url.replace("{+path}", "README.md"), {
            method: "GET"
        }).then(function (res) {
            if (res.status == 200) {
                res.json().then(function (json) {
                    var bytes = base64.decode(json.content);
                    var text = utf8.decode(bytes);
                    // console.log(text);
                    context.setState({readme: text})
                })
            } else {
                context.setState({readme: ""})
            }
        }).catch(function (error) {
            context.setState({readme: ""})
        })
    }

    handleRepoClick(item, key, keyPath) {//handle repo clicked from repolist
        const panes = this.state.panes;
        const activeKey = item.key;
        var repo = this.state.repos.filter(function (element, index, array) {
            return element.id == activeKey;
        });
        if (repo.length > 0) {
            repo = repo[0]
        }
        var exist = this.state.panes.some(function (element, index, array) {
            return element.key == activeKey
        })
        if (exist) {
            this.setState({activeKey});
        } else if (repo) {
            panes.push({title: repo.name, content: repo.description, key: activeKey});
            this.setState({panes, activeKey});
        }
        this.getRepoContributors(repo.contributors_url)
        this.getRepoReadme(repo.contents_url)
    }

    reversalColor(a) {//get reversal color with color
        a = a.replace('#', '');
        var c16, c10, max16 = 15, b = [];
        for (var i = 0; i < a.length; i++) {
            c16 = parseInt(a.charAt(i), 16);//  to 16进制
            c10 = parseInt(max16 - c16, 10);// 10进制计算
            b.push(c10.toString(16)); // to 16进制
        }
        return '#' + b.join('');
    }

    handleLogin() {//handle login btn
        if (this.state.access_token && this.state.loggedUserInfo) {
            this.setState({showUserInfoMenu: true})
        } else {
            this.handleLoginRequest();
        }
    }

    componentDidMount() {//get access_token with code from href, auto oauth when access is invalid
        let context = this;
        // console.log('componentDidMount', this.state.code, window.location.href)
        var url = window.location.href;	  //获取当前页面的url
        var len = url.length;   //获取url的长度值
        var a = url.indexOf("?");   //获取第一次出现？的位置下标
        var b = url.substr(a + 1, len);   //截取问号之后的内容
        var c = b.split("&");   //从指定的地方将字符串分割成字符串数组
        var arr = {};  //新建一个数组
        for (var i = 0; i < c.length; i++) {
            var d = c[i].split("="); //从=处将字符串分割成字符串数组,并选择第2个元素
            arr[d[0]] = d[1]	 //将获取的元素存入到数组中
        }
        if (arr['code']) {
            // fetch(GithubHost + "/login/oauth/access_token" + appOAuth + "&code=" + arr['code'], {//必须换成服务端请求
            fetch('http://localhost/github_oauth_access_token.php' + appOAuth + "&code=" + arr['code'], {
                method: 'GET',
            }).then(function (res) {
                // console.log('access_token', res)
                if (res.status == 200) {
                    res.json().then(function (json) {
                        if (json.content) {
                            // console.log(json.content)
                            let access_token = json.content.split("&")[0].split("=")[1]
                            // console.log(access_token)
                            context.setState({access_token: access_token})
                            fetch(GithubApiHost + "/user?access_token=" + access_token, {
                                method: 'GET',
                            }).then(function (res) {
                                if (res.status == 200) {
                                    res.json().then(function (json) {
                                        // console.log('user', json)
                                        context.getUserInfo(json.login, true)
                                        message.destroy()
                                    })
                                } else {
                                    context.handleLoginRequest()
                                }
                            }).catch(function (error) {
                                context.handleLoginRequest()
                                message.destroy()
                            });
                        } else {
                            message.destroy()
                        }
                    })
                } else {
                    message.destroy()
                }
            }).catch(function (error) {
                console.log('github_oauth_access_token error:', error)
                message.destroy()
            });
        } else {
            context.getUserInfo('git')
        }
    }

    handleLoginRequest() {//
        let context = this;
        if (context.state.loginLoading) {
            return
        }
        context.setState({loginLoading: message.loading('Login in progress..', 0)})
        var dataStr = (new Date()).valueOf();
        let url = GithubHost + "/login/oauth/authorize?" + client_id + "&scope=user&state=" + dataStr
        // console.log(url)
        window.location.href = url
    }

    handleLogOut() {
        this.setState({
            loggedUserInfo: {},
            access_token: undefined,
            showUserInfoMenu: false,
        })
    }

    handleMenuClick = (e) => {
        if (e.key === '1') {//1 for logged user
            this.getUserInfo(this.state.loggedUserInfo.login)
        } else if (e.key === '2') {//2 for log out
            this.handleLogOut()
        }
    }

    render() {
        let context = this;
        let loginFloatBtn = () => {//the floating login btn locating at the top right corner
            return (
                <Dropdown
                    trigger={['click']}
                    placement="bottomRight"
                    overlay={
                        context.state.showUserInfoMenu ?
                            <Menu onClick={context.handleMenuClick}>
                                <Menu.Item key="1">My Github</Menu.Item>
                                <Menu.Divider />
                                <Menu.Item key="2">Log out</Menu.Item>
                            </Menu>
                            :
                            <Menu/>
                    }>
                    <Button
                        className="login"
                        onClick={context.handleLogin.bind(context)}
                    >
                        {(() => {
                            return (
                                context.state.access_token && context.state.loggedUserInfo
                                    ?
                                    <img
                                        src={ context.state.loggedUserInfo.avatar_url}
                                        alt=""
                                    />
                                    :
                                    <Icon type="github"/>
                            )
                        })()}
                    </Button>
                </Dropdown>

            )
        }
        let userInfo = () => {//top left userinfo
            return (
                context.state.userInfo
                    ?
                    <div className='userinfoContainer'>
                        <img src={context.state.userInfo.avatar_url}
                             alt=""
                             className="img"/>
                        <div className="text">
                            {context.state.userInfo.name}
                        </div>
                    </div>
                    :
                    <div className='userinfoContainer'>
                        <Icon type="github" style={{fontSize: '26px', color: '#fff'}}/>
                    </div>
            )
        }
        let repoList = () => {//repolist in left sidebar
            return context.state.repos.filter(function (repo) {
                return context.state.enableForks ? true : (!repo.fork);
            }).map(function (repo) {
                return <Menu.Item key={repo.id} className="gitItem">
                    <Icon type="github"/>
                    <span
                        style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',}}>
                        {repo.name}
                    </span>
                </Menu.Item>
            })
        }

        let contributorsSnippet = () => {//contributors of repo in a pane
            return (
                context.state.contributors.map(function (item) {
                    let randomColor = '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).slice(-6)
                    let textColor = context.reversalColor(randomColor)
                    // console.log(randomColor, textColor)
                    return <div
                        key={item.id}
                        className="tag"
                        style={{backgroundColor: randomColor, color: textColor, borderColor: textColor}}
                        onClick={context.goToGithubUser.bind(context, item)}
                    >
                        <img className="avatar" src={item.avatar_url} alt=""/>
                        {item.login}
                    </div>
                })
            )
        }

        let paneSnippet = (key) => {//pane in tab
            let repo = context.state.repos.filter(function (element) {
                return element.id == key
            })[0]
            // console.log(repo, repo.description, repo.name)
            return (
                <div className='paneContainer'>
                    <div className="contentHead">
                        <div className="leftFloat">
                            <ButtonGroup>
                                <Button >Language</Button>
                                <Button type="primary">{repo.language ? repo.language : 'Unknow'}</Button>
                            </ButtonGroup>
                        </div>
                        <div className="rightFloat">
                            <ButtonGroup>
                                <Button icon="eye">Watch</Button>
                                <Button type="primary">{repo.watchers_count}</Button>
                            </ButtonGroup>
                            <ButtonGroup>
                                <Button icon="star">Star</Button>
                                <Button type="primary">{repo.stargazers_count}</Button>
                            </ButtonGroup>
                            <ButtonGroup>
                                <Button icon="fork">Fork</Button>
                                <Button type="primary">{repo.forks_count}</Button>
                            </ButtonGroup>
                            <Button icon='download' style={{marginLeft: '4px'}}>Download</Button>
                        </div>
                    </div>
                    <div className="contentBody">
                        {(() => {
                            return context.state.contributors.length > 0 ?
                                <div className="contributors">
                                    <p style={{fontSize: '22px'}}>Contributors:</p>
                                    <div className="tags">
                                        {contributorsSnippet()}
                                    </div>
                                </div>
                                :
                                null
                        })()}

                        <div className="description">
                            {repo.description}
                            <p></p>
                            <ReactMarkdown source={context.state.readme ? context.state.readme : ""}/>
                        </div>
                    </div>

                </div >
            )
        }

        return (
            <div className="view">
                <div className="viewWrap">
                    <div className="userinfo" onClick={context.goToGithub.bind(context)}>
                        {userInfo()}
                    </div>
                    <div className='sidebar'>
                        <div className='searchGithub'>
                            <AutoComplete
                                allowClear
                                style={{width: '100%', borderColor: 'transparent'}}
                                dataSource={context.state.searchHistory}
                                placeholder="search github user"
                                filterOption={(inputValue, option) => option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
                                onSelect={(value) => {
                                    context.setState({searchInput: value})
                                    context.getUserInfo(value)
                                }}
                                onSearch={(value) => {
                                    context.setState({searchInput: value})
                                    // context.getUserInfo(value)
                                }}
                                onChange={(value) => {
                                    context.setState({searchInput: value})
                                }}
                            >
                            </AutoComplete>
                            <Button
                                icon="search"
                                onClick={(value) => {
                                    context.getUserInfo(context.state.searchInput)
                                }}
                            />
                        </div>
                        <div className='siderbarSwitch'>
                            <span>Enable Forks</span>
                            <Switch checkedChildren='On' unCheckedChildren='Off'
                                    defaultChecked={context.state.enableForks}
                                    onChange={(enable) => {
                                        context.setState({enableForks: enable})
                                    }}/>
                        </div>
                        <Menu mode="vertical" style={{backgroundColor: 'transparent'}}
                              onClick={context.handleRepoClick.bind(context)}>
                            {repoList()}
                        </Menu>
                    </div>
                </div>
                <div className="container">
                    <Tabs
                        className='tabpane'
                        hideAdd
                        onChange={
                            (activeKey) => {
                                this.setState({activeKey});
                                var repo = context.state.repos.filter(function (element, index, array) {
                                    return element.id == activeKey;
                                });
                                if (repo.length > 0) {
                                    repo = repo[0]
                                    context.getRepoContributors(repo.contributors_url)
                                    context.getRepoReadme(repo.contents_url)
                                }
                            }
                        }
                        activeKey={context.state.activeKey}
                        type="editable-card"
                        onEdit={
                            (targetKey, action) => {
                                this[action](targetKey);
                            }
                        }
                        animated={{inkBar: true, tabPane: true}}
                    >
                        {this.state.panes.map(pane =>
                            <TabPane tab={pane.title}
                                     key={pane.key}>
                                {paneSnippet(pane.key)}
                            </TabPane>)
                        }
                    </Tabs>
                </div>
                {loginFloatBtn()}
            </div>
        );
    }

}

export default App;
