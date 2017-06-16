import React, {Component} from 'react';
import './App.less';
import {Menu, Icon, Breadcrumb, Layout, Switch, Tabs, Input, Button, Tag} from 'antd';
const SubMenu = Menu.SubMenu;
const MenuItemGroup = Menu.ItemGroup;
const {Sider, Header, Content, Footer} = Layout;
const TabPane = Tabs.TabPane;
const Search = Input.Search;
const ButtonGroup = Button.Group;
const host = 'https://api.github.com/'
const appOAuth = '?client_id=1b847c10864b9d86fe24&client_secret=ee2975df30bbe5bc1bfa169299fd12cac881065b'
const {CheckableTag} = Tag;
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
        }
    }

    componentDidMount() {
        this.getUserInfo('git')
    }

    goToGithub() {
        if (this.state.userInfo) {
            window.open(this.state.userInfo.html_url);
        }
    }

    getUserInfo(user) {
        let context = this;
        fetch(host + 'users/' + user + appOAuth, {
            method: 'GET'
        }).then(function (res) {
            res.json().then(function (json) {
                // console.log('getUserInfo', json)
                context.setState({userInfo: json, githubUser: user, contributors: []})
                context.getUserRepos(json.repos_url)
            })
        }).catch(function (error) {
            console.log(error)
        });
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
        console.log('url', url)
        if (url) {
            let context = this;
            fetch(url + appOAuth, {
                method: 'GET'
            }).then(function (res) {
                res.json().then(function (json) {
                    console.log('getContributors', json)
                    context.setState({contributors: json})
                })
            }).catch(function (error) {
                console.log(error)
            });
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
            if (pane.key === targetKey) {
                lastIndex = i - 1;
            }
        });
        const panes = this.state.panes.filter(pane => pane.key !== targetKey);
        if (lastIndex >= 0 && activeKey === targetKey) {
            activeKey = panes[lastIndex].key;
        }
        this.setState({panes, activeKey});
    }
    handleActivePane = (activeKey) => {
        this.setState({activeKey});
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
                    let randomColor='#'+(Math.random()*0xffff66<<0).toString(16)
                    return <Tag
                        color={randomColor}
                        style
                    >
                        {item.login}
                    </Tag>
                })
            )
        }
        let paneSnippet = (key) => {
            let repo = context.state.repos.filter(function (element) {
                if (element.id == key) {
                    return element
                }
            })[0]
            // console.log(repo, repo.description, repo.name)
            return (
                <div className='paneContainer'>
                    <div className="contentHead">
                        <div className="leftFloat">
                            <ButtonGroup>
                                <Button >Language</Button>
                                <Button type="primary">{repo.language}</Button>
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
                            <Button icon='download' style={{marginLeft:'4px'}}>Download</Button>
                        </div>
                    </div>
                    <div className="contentBody">
                        <div className="contributors">
                            <p style={{fontSize:'22px'}}>Contributors:</p>
                            {contributorsSnippet()}
                        </div>
                        <div className="description">
                            {repo.description}
                        </div>
                    </div>
                </div>
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
                            <Search
                                placeholder="search github user"
                                onSearch={value => {
                                    context.getUserInfo(value)
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
            </div>
        );
    }
}

export default App;
