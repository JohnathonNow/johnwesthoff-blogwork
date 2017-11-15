#!/bin/bash
ava=`avahi-browse -part | grep raspberrypi.*fe | tail -n 1`
int=`echo $ava | cut -d';' -f 2`
adr=`echo $ava | cut -d';' -f 8`
ful="pi@$adr%$int"
ssh $ful $@
