import React, { Component } from 'react';
import { Platform, StyleSheet, ImageBackground, Text, View, Image, ActionSheetIOS, TextInput, Button, ActivityIndicator, Picker, TouchableOpacity, ScrollView, TouchableHighlight, ListView, AsyncStorage} from 'react-native';

// Android and Ios native modules
import {NativeModules} from 'react-native';
var IosWallet = NativeModules.refreshWallet;
var AndroidWallet = NativeModules.AndroidWallet;

var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

export default class Wallet extends React.Component{

    static navigationOptions = {
        drawerLabel: 'TRANSACTION HISTORY',
        drawerIcon: ({ tintColor }) => (
            <Image source={require('../resources/images/transaction_history_drawer_icon_light.png')} resizeMode={Image.resizeMode.contain}  style={{width:25, height:25}}/>
        ),
    };

    // every time we open the main page fo the following
    // 1. update cmc related info
    // 2. update list of 10 latest tx
    componentDidMount() {
        let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        // update QRL market data
        fetch('https://market-data.automated.theqrl.org/', {
            method: 'GET',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            },
        }).then((response) => response.json())
        .then((responseJson) => {
            this.setState({marketcap: Number((parseFloat(responseJson.market_cap)).toFixed()), price: Number((parseFloat(responseJson.price)).toFixed(2)) , change24: Number((parseFloat(responseJson.change_24hr)).toFixed(2)) })

            if (responseJson.change_24hr.includes("-")){this.setState({changeup: false})}
            else {this.setState({changeup: true})}

            // Update the wallet each time the user switch to this view
            // Ios
            this.setState({isLoading:true})

            // get the currect walletindex
            AsyncStorage.getItem("walletindex").then((walletindex) => {
                if (Platform.OS === 'ios'){
                    IosWallet.refreshWallet(walletindex, (error, walletAddress, otsIndex, balance, keys)=> {
                        this.setState({walletAddress: walletAddress, isLoading:false, updatedDate: new Date(), balance: balance, otsIndex: otsIndex, dataSource: ds.cloneWithRows(JSON.parse(keys) )})
                    });
                }
                // Android
                else {
                    AndroidWallet.refreshWallet(walletindex,  (err) => {console.log(err);}, (walletAddress, otsIndex, balance, keys)=> {
                        this.setState({walletAddress: walletAddress, isLoading:false, updatedDate: new Date(), balance: balance, otsIndex: otsIndex, dataSource: ds.cloneWithRows(JSON.parse(keys) )})
                    });
                }
            }).catch((error) => {console.log(error)});
        })
    }

    constructor(props) {
        super(props);
        this.state = {
            updatedDate : new Date(),
            isLoading: true,
            passphrase : '',
            processing: false,
            balance : 0,
            refreshBtnTop: Platform.OS === 'ios'? 10: 2,
        }
    }

    // Refresh wallet balance
    refreshWallet = () => {
        fetch('https://market-data.automated.theqrl.org/', {
            method: 'GET',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            },
        }).then((response) => response.json())
        .then((responseJson) => {
            this.setState({marketcap: Number((parseFloat(responseJson.market_cap)).toFixed()), price: Number((parseFloat(responseJson.price)).toFixed(2)) , change24: Number((parseFloat(responseJson.change_24hr)).toFixed(2)) })

            if (responseJson.change_24hr.includes("-")){this.setState({changeup: false})}
            else {this.setState({changeup: true})}

            // Update the wallet each time the user switch to this view
            // Ios
            this.setState({isLoading:true})
            // get the currect walletindex
            AsyncStorage.getItem("walletindex").then((walletindex) => {

                if (Platform.OS === 'ios'){
                    IosWallet.refreshWallet(walletindex, (error, walletAddress, otsIndex, balance, keys)=> {
                        this.setState({walletAddress: walletAddress, isLoading:false, updatedDate: new Date(), balance: balance, otsIndex: otsIndex, dataSource: ds.cloneWithRows(JSON.parse(keys) )})
                    });
                }
                // Android
                else {
                    AndroidWallet.refreshWallet(walletindex, (err) => {console.log(err);}, (walletAddress, otsIndex, balance, keys)=> {
                        this.setState({walletAddress: walletAddress, isLoading:false, updatedDate: new Date(), balance: balance, otsIndex: otsIndex, dataSource: ds.cloneWithRows(JSON.parse(keys) )})
                    });
                }

            }).catch((error) => {console.log(error)});
        })
    }

    renderRow(rowData, sectionID, rowID) {
        // format the QUANTA amount
        if (rowData.desc % 1000000000 == 0){
            amount = rowData.desc / 1000000000
        }
        else {
            amount = rowData.desc / 1000000000
        }
        var txhash = rowData.txhash;

        return (
            <TouchableHighlight onPress={()=> this.props.navigation.navigate('TxDetailsView', {txhash: txhash})} underlayColor='white'>
            <View>
                <View style={{flex: 1, flexDirection:'row',  height:80, paddingTop:20}}>

                    {rowData.title == "RECEIVED"?
                        <View>
                            <Image source={require('../resources/images/received.png')} resizeMode={Image.resizeMode.contain} style={{height:40, width:40,marginLeft:20, marginRight:10}} />
                        </View>
                    :
                        <View>
                            <Image source={require('../resources/images/sent.png')} resizeMode={Image.resizeMode.contain} style={{height:40, width:40,marginLeft:20, marginRight:10}} />
                        </View>
                    }
                    <View style={{flex:1, flexDirection:'row'}}>
                        <View style={{flex:1,alignItems:'flex-start'}}>
                            <Text>{rowData.title}</Text>
                            <Text>{rowData.date}</Text>
                        </View>
                        <View style={{alignItems:'flex-end', paddingRight:20}}>
                            <Text style={{color:'#15437a'}}>{amount.toString()} QUANTA</Text>
                        </View>
                    </View>
                </View>
                {/*Do not show separator on the last item of the list*/}
                {rowID < 9 ? 
                    <View style={{height: .5,width: "90%",backgroundColor: "#000",alignSelf:'center'}}/>
                    :
                    undefined
                }
                </View>

            </TouchableHighlight>
          );
    }

    render() {
        if (this.state.isLoading) {
            return (
                <ImageBackground source={require('../resources/images/main_bg_half.png')} style={styles.backgroundImage}>
                    <View style={{flex:1}}>
                        <View style={{alignItems:'flex-start', justifyContent:'flex-start', paddingTop:40, paddingLeft:30}}>
                            <TouchableHighlight onPress={()=> this.props.navigation.openDrawer()} underlayColor='white'>
                                <Image source={require('../resources/images/sandwich.png')} resizeMode={Image.resizeMode.contain} style={{height:25, width:25}} />
                            </TouchableHighlight>
                        </View>
                        <ScrollView style={{flex:2}}>
                            <View style={{ alignItems:'center',paddingTop:10, flex:0.5}}>
                                <Image source={require('../resources/images/qrl_logo_wallet.png')} resizeMode={Image.resizeMode.contain} style={{height:100, width:100}} />
                                <Text style={{color:'white'}}>LAST UPDATE: ...</Text>
                            </View>

                            <View style={{ alignItems:'center',flex:1}}>
                                <ImageBackground source={require('../resources/images/fund_bg.png')} resizeMode={Image.resizeMode.contain} style={{height:240, width: 360, justifyContent:'center',alignItems:'center', paddingTop: 30}} >
                                    <Text style={{color:'white'}}>QRL BALANCE</Text>
                                    <Text style={{color:'white',fontSize:30}}>0</Text>
                                    <Text style={{color:'white',fontSize:13}}>USD $0</Text>
                                    <View style={{width:"80%", borderRadius:10, flexDirection:'row', paddingTop:30,paddingBottom:5}}>
                                        <View style={{flex:1}}><Text style={{fontSize:12, color:"white"}}>MARKET CAP</Text></View>
                                        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text style={{fontSize:12, color:"white"}}>PRICE</Text></View>
                                        <View style={{flex:1}}><Text style={{fontSize:12, color:"white"}}>24H CHANGE</Text></View>
                                    </View>

                                    <View style={{backgroundColor:"#d12835", height:40, flexDirection:'row', width:"90%", borderRadius:10}}>
                                        <View style={{flex:1, justifyContent:'center'}}><Text style={{fontSize:12, color:"white"}}>NA</Text></View>
                                        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}><Text style={{fontSize:12, color:"white"}}>NA</Text></View>
                                        <View style={{flex:1, justifyContent:'center'}}><Text style={{fontSize:12, color:"white"}}>NA</Text></View>
                                    </View>

                                    <View style={{alignSelf:'flex-end', right:23}}>
                                        <Text style={{color:'white',fontSize:10}}>Powered by COINLIB</Text>
                                    </View>

                                    <TouchableOpacity style={{alignItems:'center',justifyContent:'center',alignSelf:'center',top:this.state.refreshBtnTop,right:2}} activeOpacity = { .5 } onPress={ this.refreshWallet }>
                                        <Image source={require("../resources/images/refresh.png")} style={{height:40, width:40}}/>
                                    </TouchableOpacity>
                                </ImageBackground>
                            </View>

                            <View style={{backgroundColor:'white', flex:2, width:350, alignSelf:'center', borderRadius:10, marginTop:10}}>
                                <Text style={{alignItems:'center', alignSelf:'center', paddingTop:20, marginBottom:20}}>TRANSACTION HISTORY</Text>
                            </View>
                        </ScrollView>
                    </View>
                </ImageBackground>
            );
        }

        else {
            // formatting minutes and address to user interface
            minutes = this.state.updatedDate.getMinutes();
            minutes < 10 ? minUI = "0" + minutes : minUI = minutes;
            addressBegin = this.state.walletAddress.substring(1, 10);
            addressEnd = this.state.walletAddress.substring(58, 79);

            return (
                <ImageBackground source={require('../resources/images/main_bg_half.png')} style={styles.backgroundImage}>
                    <View style={{flex:1}}>

                        <View style={{alignItems:'flex-start', justifyContent:'flex-start', paddingTop:40, paddingLeft:30}}>
                            <TouchableHighlight onPress={()=> this.props.navigation.openDrawer()} underlayColor='white'>
                                <Image source={require('../resources/images/sandwich.png')} resizeMode={Image.resizeMode.contain} style={{height:25, width:25}} />
                            </TouchableHighlight>
                        </View>

                        <ScrollView style={{flex:2}}>
                            <View style={{ alignItems:'center',paddingTop:10, flex:0.5}}>
                                <Image source={require('../resources/images/qrl_logo_wallet.png')} resizeMode={Image.resizeMode.contain} style={{height:100, width:100}} />
                                <Text style={{color:'white'}}>LAST UPDATE: {this.state.updatedDate.getDate()}.{this.state.updatedDate.getMonth() + 1}.{this.state.updatedDate.getFullYear()} {this.state.updatedDate.getHours()}:{minUI}</Text>
                            </View>

                            <View style={{ alignItems:'center',flex:1}}>
                                <ImageBackground source={require('../resources/images/fund_bg.png')} resizeMode={Image.resizeMode.contain} style={{height:240, width:360, justifyContent:'center',alignItems:'center', paddingTop: 30}} >
                                    <Text style={{color:'white'}}>QRL BALANCE</Text>
                                    <Text style={{color:'white', fontWeight: "bold"}}>Q{addressBegin}...{addressEnd}</Text>
                                    <Text style={{color:'white',fontSize:30}}>{this.state.balance / 1000000000 }</Text>
                                    <Text style={{color:'white',fontSize:13}}>USD ${ ((this.state.balance / 1000000000 ) * this.state.price).toFixed(2) }</Text>

                                    <View style={{width:"80%", borderRadius:10, flexDirection:'row', paddingTop:15,paddingBottom:5}}>
                                        <View style={{flex:1}}><Text style={{fontSize:12, color:"white"}}>MARKET CAP</Text></View>
                                        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text style={{fontSize:12, color:"white"}}>PRICE</Text></View>
                                        <View style={{flex:1}}><Text style={{fontSize:12, color:"white", right:-10}}>24H CHANGE</Text></View>
                                    </View>

                                    <View style={{backgroundColor:"#d12835", height:40, flexDirection:'row', width:"90%", borderRadius:10, paddingLeft:15}}>
                                        <View style={{flex:1, justifyContent:'center'}}><Text style={{fontSize:12, color:"white",fontWeight: "bold"}}>${ (this.state.marketcap / 1000000).toFixed(2) }M <Text style={{fontSize:8, color:"white"}}>USD</Text></Text></View>
                                        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}><Text style={{fontSize:12, color:"white",fontWeight: "bold"}}>${this.state.price}<Text style={{fontSize:8, color:"white"}}> USD</Text></Text></View>

                                        { this.state.changeup ?
                                            <View style={{flex:1, justifyContent:'center'}}>
                                                <View style={{flexDirection:'row', justifyContent:'center'}}>
                                                    <Image source={require('../resources/images/arrow_up.png')} resizeMode={Image.resizeMode.contain} style={{height:10, width:10}} />
                                                    <Text style={{fontSize:12, color:"white"}}>({this.state.change24} %)</Text>
                                                </View>
                                            </View>
                                            :
                                            <View style={{flex:1, justifyContent:'center'}}>
                                                <View style={{flexDirection:'row', justifyContent:'center'}}>
                                                    <Image source={require('../resources/images/arrow_down.png')} resizeMode={Image.resizeMode.contain} style={{height:10, width:10}} />
                                                    <Text style={{fontSize:12, color:"white"}}>({this.state.change24} %)</Text>
                                                </View>
                                            </View>
                                        }
                                    </View>

                                    <View style={{alignSelf:'flex-end', right:23}}>
                                        <Text style={{color:'white',fontSize:10}}>Powered by COINLIB</Text>
                                    </View>

                                    <TouchableOpacity style={{alignItems:'center',justifyContent:'center',alignSelf:'center',top:this.state.refreshBtnTop,right:2}} activeOpacity = { .5 } onPress={ this.refreshWallet }>
                                        <Image source={require("../resources/images/refresh.png")} style={{height:40, width:40}}/>
                                    </TouchableOpacity>
                                </ImageBackground>
                            </View>

                            <View style={{backgroundColor:'white', flex:2, width:350, alignSelf:'center', borderRadius:10, marginTop:10}}>
                                <Text style={{alignItems:'center', alignSelf:'center', paddingTop:20, marginBottom:20}}>TRANSACTION HISTORY</Text>
                                    <View style={{height: .5,width: "90%",backgroundColor: "#000",alignSelf:'center'}}/>
                                {this.state.dataSource == "{}" ?
                                    <Text style={{alignSelf:'center'}}>No Transaction</Text>
                                    :
                                    <ListView automaticallyAdjustContentInsets={false} dataSource={this.state.dataSource} renderRow={this.renderRow.bind(this)} enableEmptySections={true} />
                                }
                            </View>
                        </ScrollView>
                        <View style={{height:30}}></View>
                    </View>
                </ImageBackground>
            );
        }
    }
}

// styling
const styles = StyleSheet.create({
    SubmitButtonStyle: {
        width: 200,
        marginTop:10,
        paddingTop:15,
        paddingBottom:15,
        marginLeft:30,
        marginRight:30,
        backgroundColor:'#398cfb',
        borderRadius:10,
        borderWidth: 1,
        borderColor: '#fff'
    },
    TextStyle:{
        color:'#fff',
        textAlign:'center',
    },
    backgroundImage: {
        flex: 1,
        width: null,
        height: null,
    }
});
