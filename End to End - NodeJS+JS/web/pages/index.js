import React from 'react';
import Head from 'next/head'
import { Container, Grid, Paper, Typography, Tab, Box } from '@material-ui/core'
import TabContext from '@material-ui/lab/TabContext';
import TabList from '@material-ui/lab/TabList';
import TabPanel from '@material-ui/lab/TabPanel';
import EmailPassword from '../components/email_password';
import DeviceList from '../components/device_list';

import { EventType, UserInfo } from "@userwatch/web";
import { FUNCTIONS_URL } from '../userwatch.config';

// CHANGE ME
const functionsBaseUrl = FUNCTIONS_URL

export default function Home(props) {
  const [tabValue, setTabValue] = React.useState("1");
  const [userID, setUserID] = React.useState("");
  const [deviceID, setDeviceID] = React.useState("");

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const updateUserID = (userID) => {
    var userInfo = new UserInfo();
    userInfo.setUserid(userID);
    props.userwatch.validate(userInfo, EventType.LOGIN_SUCCESS, true);
    setUserID(userID);
  }

  return (
   <Container maxWidth="md">
     <Grid container direction="column" justifyContent="center" alignItems="center" style={{ minHeight: "100vh" }}>
     <Paper>
       <Box width={800}>
       <TabContext value={tabValue}>
  <TabList onChange={handleTabChange}
    indicatorColor="primary"
    textColor="primary"
    centered
  >
    <Tab label="Register" value="1"/>
    <Tab label="Login" value="2"/>
    <Tab label="Device List" value="3"/>
  </TabList>
  <TabPanel value="1"><EmailPassword baseURL={functionsBaseUrl} userwatch={props.userwatch} deviceIDCallback={setDeviceID} deviceID={deviceID} userIDCallback={updateUserID} userID={userID} register={true}/></TabPanel>
  <TabPanel value="2"><EmailPassword baseURL={functionsBaseUrl} userwatch={props.userwatch} deviceIDCallback={setDeviceID} deviceID={deviceID} userIDCallback={updateUserID} userID={userID}/></TabPanel>
  <TabPanel value="3"><DeviceList baseURL={functionsBaseUrl} userID={userID}/></TabPanel>
  </TabContext>
  </Box>
</Paper>
</Grid>
   </Container>
  )
}
