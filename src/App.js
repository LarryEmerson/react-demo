import React, {Component} from 'react';
import './App.less';
import {Menu, Icon, Switch, Tabs, Button, AutoComplete} from 'antd';
const TabPane = Tabs.TabPane;
const ButtonGroup = Button.Group;
const GithubHost = 'https://github.com'
const GithubApiHost = 'https://api.github.com'
const client_id = 'client_id=1b847c10864b9d86fe24'
const client_secret = 'client_secret=ee2975df30bbe5bc1bfa169299fd12cac881065b'
const appOAuth = '?' + client_id + '&' + client_secret


class App extends Component {
    constructor() {
        super();
        this.state = {
            githubUser: undefined,
            userInfo: undefined,
            repos: [],
            enableForks: false,
            panes: [],
            activeKey: undefined,
            contributors: [],
            searchHistory: [],

            loginStatus: 0,
            loginModal: false,
            loginLoading: false,

            requestOauth: false,

            access_token: undefined,
        }
    }


    goToGithub() {
        if (this.state.userInfo) {
            this.goToGithubUser(this.state.userInfo)
        }
    }

    goToGithubUser(user) {
        if (user && user.html_url) {
            window.open(user.html_url);
        }
    }

    getUserInfo(user) {
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
                    context.setState({
                        searchHistory: searchH,
                        userInfo: json, githubUser: user, repos: [],
                        panes: [], activeKey: undefined, contributors: []
                    })
                    context.getUserRepos(json.repos_url)
                })
            }).catch(function (error) {
                console.log(error)
            });
        }
    }

    getUserRepos(url) {
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

    getContributors(url) {
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
                console.log('getContributors error:', error)
                context.setState({contributors: []})
            });
        } else {
            context.setState({contributors: []})
        }
    }

    handleRepoClick(item, key, keyPath) {
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
        this.getContributors(repo.contributors_url)
    }

    handlePaneEdit = (targetKey, action) => {
        this[action](targetKey);
    }
    remove = (targetKey) => {
        let activeKey = this.state.activeKey;
        let lastIndex;
        this.state.panes.forEach((pane, i) => {
            if (pane.key == targetKey) {
                lastIndex = i - 1;
            }
        });
        const panes = this.state.panes.filter(pane => pane.key !== targetKey);
        if (lastIndex >= 0 && activeKey == targetKey) {
            activeKey = panes[lastIndex].key;
        }
        this.setState({panes, activeKey});
    }
    handleActivePane = (activeKey) => {
        this.setState({activeKey});
        var repo = this.state.repos.filter(function (element, index, array) {
            return element.id == activeKey;
        });
        if (repo.length > 0) {
            repo = repo[0]
            this.getContributors(repo.contributors_url)
        }
    }

    reversalColor(a) {
        a = a.replace('#', '');
        var c16, c10, max16 = 15, b = [];
        for (var i = 0; i < a.length; i++) {
            c16 = parseInt(a.charAt(i), 16);//  to 16进制
            c10 = parseInt(max16 - c16, 10);// 10进制计算
            b.push(c10.toString(16)); // to 16进制
        }
        return '#' + b.join('');
    }

    handleLogin() {
        if (this.state.loginStatus) {
            this.getUserInfo(this.state.userInfo.login)
        } else {
            this.handleModalLogin();
            // this.setState({loginModal: true})
        }
    }



    componentDidMount() {
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
                                        context.getUserInfo(json.login)
                                    })
                                }
                            })

                        }
                    })
                }
            });
        } else {
            context.getUserInfo('git')
        }
    }

    handleModalLogin() {
        let context = this;
        var dataStr = (new Date()).valueOf();
        context.setState({requestOauth: true})
        let url = GithubHost + "/login/oauth/authorize?" + client_id + "&scope=user&state=" + dataStr
        // console.log(url)
        window.location.href = url
    }

    render() {
        let context = this;
        let menuSnippet = () => {
            return context.state.repos.filter(function (repo) {
                return context.state.enableForks ? true : repo.fork == false;
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
        let userInfo = () => {
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
        let contributorsSnippet = () => {
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
        let paneSnippet = (key) => {
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
                        </div>
                    </div>

                </div >
            )
        }
        let loginFloatBtn = () => {
            return (
                <Button className="login"
                        onClick={context.handleLogin.bind(context)}
                >
                    {(() => {
                        return context.state.loginStatus ?
                            <img
                                src={ "https://avatars1.githubusercontent.com/u/18133?v=3"}
                                alt=''/>
                            : <Icon type="github"/>
                    })()}
                </Button>
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
                                    context.getUserInfo(value)
                                }}
                                onChange={(value) => {
                                    context.setState({searchInput: value})
                                }}
                            >
                            </AutoComplete>
                            <Button
                                icon="search" onClick={(value) => {
                                context.getUserInfo(context.state.searchInput)
                            }}/>
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
                            {menuSnippet()}
                        </Menu>
                    </div>
                </div>
                <div className="container">
                    <Tabs
                        className='tabpane'
                        hideAdd
                        onChange={context.handleActivePane}
                        activeKey={context.state.activeKey}
                        type="editable-card"
                        onEdit={this.handlePaneEdit}
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
