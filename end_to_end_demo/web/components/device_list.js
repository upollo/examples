import { Avatar, Container, Grid, IconButton, List, ListItem, ListItemAvatar, ListItemSecondaryAction, ListItemText, Typography } from "@material-ui/core";
import { RemoveCircle, RemoveCircleOutline } from "@material-ui/icons";
import React from "react";


export default function DeviceList(props) {
    const [deviceList, setDeviceList] = React.useState([]);
    const [respJson, setRespJson] = React.useState({});

    React.useMemo(async () => {
      if (props.userID) {
        var response = await fetch(props.baseURL + "listDevices", {
            method: "POST",
            headers: {
              "Content-type": "application/json",
            },
            body: JSON.stringify({ userID: props.userID })
          });
          var respJson = await response.json();
              
          setDeviceList(respJson.devicesList)
        }
    }, [respJson])

    const block =  (deviceID) => async (event) => {
      var response = await fetch(props.baseURL + "blockDevice", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({ deviceID: deviceID })
      });
      var respJson = await response.json();
      setRespJson(respJson);
    }

    const unblock =  (deviceID) => async (event) => {
      var response = await fetch(props.baseURL + "unblockDevice", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({ deviceID: deviceID })
      });
      var respJson = await response.json();
      setRespJson(respJson);
    }

    return (
      <Container>
      {props.userID &&
        <Grid container direction="column" spacing={2}>
            <Grid item>
        <Typography variant="h6">
            Device List
        </Typography>
        <Typography variant="body">
            Use <RemoveCircle /> to ban and <RemoveCircleOutline />  to unban a device
        </Typography>
        </Grid>
        <Grid item>
        <List>
        {deviceList && deviceList.map((device, index) => (
            <ListItem key={"devicelist"+index}>
                <ListItemAvatar>
                    <Avatar>
                    </Avatar>
                    </ListItemAvatar>
                <ListItemText
                    primary={device.browser + " on " + device.os}
                    secondary={"ID: " + device.deviceid + ". Last seen: " + new Date((device.lastused.seconds * 1000) + (device.lastused.nanos/1000000)).toLocaleString()}
                />
                <ListItemSecondaryAction>
                    {!(device.blockedforthisuser || device.blockedglobally)  &&
                    <IconButton edge="end" aria-label="block" onClick={block(device.deviceid)}>
                      <RemoveCircle />
                    </IconButton>}
                    {(device.blockedforthisuser || device.blockedglobally) &&
                    <IconButton edge="end" aria-label="block" onClick={unblock(device.deviceid)}> 
                      <RemoveCircleOutline />
                    </IconButton>}
                  </ListItemSecondaryAction>
            </ListItem>
        ))}
        </List>
        </Grid>
        </Grid>}

      {!props.userID && 
      <Typography>Please register or login to view</Typography>}
      </Container>
    )
}