// Reporter
// Last Updated: 2019-08-16
// A script to deal and take cards to selected users from specified decks.
on('ready', () => {
    const version = '0.0.1';
    log('-=> Rest v' + version + ' <=-');

    on('chat:message', (msg) => {
        if ('api' === msg.type && /!r-(short|long|charges|ammo)\b/i.test(msg.content) && msg.selected) {
            let idList = [];
            let nameList = []
            log('Sandbox is up');
            
            function checkRestList(rName){
            let shortRestList = ['Invocations','Channel Divinity','Wild Shape','Superiority Dice','Ki Points'];
            let longRestList = ['Rages','Lay on Hands','Sorcery Points'];
            let ammoList = ['Crossbow bolts','Arrows','Bullets','Darts'];
                  rRecoverName = rName;
           
            if (ammoList.includes(rName)){
                 rRecoverName = rName+'+ammo';
           }
//            else if (shortRestList.includes(rName)&&msg.content.includes('short')){
            else if (longRestList.includes(rName)){
                rRecoverName = rName+'+LR';
            }
//            else if (longRestList.includes(rName)&&msg.content.includes('long')){
            else if (shortRestList.includes(rName)){
                rRecoverName = rName+'+SR';
            } else{
                rRecoverName = rName+'+x';
            }
             log('THE MESSAGE CONTENT IS'+msg.content);
 log('THE RESOURCE NAME IS IS'+rName);
 log('THE MESSAGERECOVERY CODE IS'+rRecoverName);

            return rRecoverName;
            }
            
            
            const attrLookup = (characterid, name, caseSensitive) => {
                let match = name.match(/^(repeating_.*)_\$(\d+)_.*$/);
                if (match) {
                    let index = match[2],
                        attrMatcher = new RegExp(`^${name.replace(/_\$\d+_/,'_([-\\da-zA-Z]+)_')}$`, (caseSensitive ? '' : 'i')),
                        createOrderKeys = [],
                        attrs = _.chain(findObjs({
                            type: 'attribute',
                            characterid
                        }))
                        .map((a) => {
                            return {
                                attr: a,
                                match: a.get('name').match(attrMatcher)
                            };
                        })
                        .filter((o) => o.match)
                        .each((o) => createOrderKeys.push(o.match[1]))
                        .reduce((m, o) => {
                            m[o.match[1]] = o.attr;
                            return m;
                        }, {})
                        .value(),
                        sortOrderKeys = _.chain(((findObjs({
                            type: 'attribute',
                            characterid,
                            name: `_reporder_${match[1]}`
                        })[0] || {
                            get: _.noop
                        }).get('current') || '').split(/\s*,\s*/))
                        .intersection(createOrderKeys)
                        .union(createOrderKeys)
                        .value();
                    if (index < sortOrderKeys.length && _.has(attrs, sortOrderKeys[index])) {
                        return attrs[sortOrderKeys[index]];
                    }
                    return;
                }
                return findObjs({
                    type: 'attribute',
                    characterid,
                    name: name
                }, {
                    caseInsensitive: !caseSensitive
                })[0];
            };

            //Dice rolling function
            const parse = (txt) => {
                const tokenize = /(\d+d\d+|\d+|\+|-)/ig;
                const dieparts = /^(\d+)?d(\d+)$/i;
                const ops = {
                    '+': (m, n) => m + n,
                    '-': (m, n) => m - n
                };
                let op = '+';

                return (txt.replace(/\s+/g, '').match(tokenize) || []).reduce((m, t) => {
                    let matches = t.match(dieparts);
                    if (matches) {
                        return ops[op](m, [...Array(parseInt(matches[1]) || 1)].reduce(m => m + randomInteger(parseInt(matches[2])), 0));
                    } else if (/^\d+$/.test(t)) {
                        return ops[op](m, parseInt(t));
                    } else {
                        op = t;
                        return m;
                    }
                }, 0);
            };


            //var newvalue = parse('1d6');
            //log (newvalue);

            //Get character list. Future versions may handle multiple characters
            let TCData = msg.selected
                .map(o => getObj('graphic', o._id))
                .filter(o => undefined !== o)
                .filter(t => t.get('represents').length)
                .map(t => ({
                    token: t,
                    character: getObj('character', t.get('represents'))
                }))
                .filter(o => undefined !== o.character);
            var allIDs = TCData.map(n => n.character.get('_id'));

            var characterID = (allIDs[0]);
            var myCharacter = getObj('character', characterID);


            var resourceName_l = [],
                resourceRecovery_l = [],
                resourceCurrent_l = [],
                resourceMax_l = [],
                resourceName_r = [],
                resourceRecovery_r = [],
                resourceCurrent_r = [],
                resourceMax_r = [];



            resourceName_c = getAttrByName(characterID, "class_resource_name");
 log('CLASS ------------------------------');
                   log('Resource Name c pre-change = '+resourceName_c);
            resourceName_c=checkRestList(resourceName_c)
                    log('Resource Name c post-change = '+resourceName_c);
            resourceRecovery_c = resourceName_c.split(/\+(.+)/)[1]; //Regex splits on first occurence of '+', so the dice strings are preserved
            resourceCurrent_c = getAttrByName(characterID, "class_resource");
            resourceMax_c = getAttrByName(characterID, "class_resource", "max");
            ///log(resourceMax_c);


            resourceName_o = getAttrByName(characterID, "other_resource_name");
log('OTHER ------------------------------');
                    log('Resource Name o pre-change = '+resourceName_o);
            resourceName_o=checkRestList(resourceName_o)
                    log('Resource Name o post-change = '+resourceName_o);
            resourceRecovery_o = resourceName_o.split(/\+(.+)/)[1];
            resourceCurrent_o = getAttrByName(characterID, "other_resource");
            resourceMax_o = getAttrByName(characterID, "other_resource", "max");


            //Get Repeating Resources
            var i = 0
            do {
                if (getAttrByName(characterID, 'repeating_resource_$' + i + '_resource_left_name')) {
                    resourceName_l[i] = getAttrByName(characterID, 'repeating_resource_$' + i + '_resource_left_name');
log('LEFT '+i+' ------------------------------');
                    log('Resource Name L pre-change = '+resourceName_l[i]);
            resourceName_l[i]=checkRestList(resourceName_l[i])
                    log('Resource Name L post-change = '+resourceName_l[i]);
                    resourceRecovery_l[i] = resourceName_l[i].split(/\+(.+)/)[1];
                    resourceCurrent_l[i] = getAttrByName(characterID, 'repeating_resource_$' + i + '_resource_left');
                    resourceMax_l[i] = getAttrByName(characterID, 'repeating_resource_$' + i + '_resource_left', 'max');
                }
                if (getAttrByName(characterID, 'repeating_resource_$' + i + '_resource_right_name')) {
                    resourceName_r[i] = getAttrByName(characterID, 'repeating_resource_$' + i + '_resource_right_name');
log('RIGHT '+i+' ------------------------------');
                    log('Resource Name R pre-change = '+resourceName_r[i]);
            resourceName_r[i]=checkRestList(resourceName_r[i])
                    log('Resource Name R post-change = '+resourceName_r[i]);
                    resourceRecovery_r[i] = resourceName_r[i].split(/\+(.+)/)[1];
                    resourceCurrent_r[i] = getAttrByName(characterID, 'repeating_resource_$' + i + '_resource_right');
                    resourceMax_r[i] = getAttrByName(characterID, 'repeating_resource_$' + i + '_resource_right', 'max');
                }
                i++;
            }

            while (i < 10);




            //var myReport= JSON.stringify(allIDs);
            //log ('Resource name: '+ resourceName_c + '   Recovery Rate: '+resourceRecovery_c+ '   Current: '+resourceCurrent_c+ '   Max: '+resourceMax_c);




            //recover resources function
            function recoverResource(rFullName, rName, rRecover, rCurrent, rMax) {
                //           log ('rCurrent Type =  '+ typeof rCurrent);
                let r = attrLookup(characterID, rCurrent);
                log(rRecover);
//                if (rRecover||msg.content.includes("ammo")) {
//                    if (msg.content.includes("ammo")){rRecover="ammo"}
                    
                    if ((rRecover.includes("SR") && msg.content.includes("short")) || ((rRecover.includes("LR")||rRecover.includes("SR")) && msg.content.includes("long"))) {


                        //    }
                        log('function return rFullName =  ' + rFullName);
                        log('function return rName =  ' + rName);
                        log('function return rRecover =  ' + rRecover);
                        log('function returns rCurrent =  ' + rCurrent);
                        log('function return rMax =  ' + rMax);

                        if (rRecover.includes('d')) {
                            log("full recover string = " + rRecover);

                            rRecover = rRecover.split(/SR|LR/)[1],
                                log("dice expression = " + rRecover);
                            let recoverAmount = parse(rRecover)
                            r.set('current', Math.min(Number(r.get('current')) + recoverAmount, rMax));
                        } else {
                            r.set('current', rMax);
                        }
                    } else if (rRecover.includes("d") && !rRecover.includes('R') && msg.content.includes("charges")) {
                        let recoverAmount = parse(rRecover);
                        r.set('current', Math.min(Number(r.get('current')) + recoverAmount, rMax));

                    } else if (rRecover.includes('ammo') && msg.content.includes("ammo")) {
                        let recoverAmount = (rMax- Number(r.get('current')))+'d2-'+(rMax- Number(r.get('current')));
                        log ('recoverAmount = '+recoverAmount);
                        recoverAmount = parse(recoverAmount);
                        log ('recoverresult = '+recoverAmount);
//                        parse(rRecover);
                        r.set('current', Math.min(Number(r.get('current')) + recoverAmount, rMax));
                        r.set('max', r.get('current'));

                    }
                }
//            }


            //    let bob = parse(rRecover)
            //    log("bob =" + bob + '     rcurrent = '+ r.get('current'));

            //Run Recoveries Here

            recoverResource(resourceName_c, "class_resource_name", resourceRecovery_c, "class_resource", resourceMax_c);
            recoverResource(resourceName_o, "other_resource_name", resourceRecovery_o, "other_resource", resourceMax_o);


            i = 0;
            do {
                if (resourceName_l[i])
                //log ('Resource name: '+ resourceName_l[i] + '   Recovery Rate: '+resourceRecovery_l[i]+ '   Current: '+resourceCurrent_l[i]+ '   Max: '+resourceMax_l[i]);
                {
                    recoverResource(resourceName_l[i], 'repeating_resource_$' + i + '_resource_left_name', resourceRecovery_l[i], 'repeating_resource_$' + i + '_resource_left', resourceMax_l[i]);

                }
                i++;
            }
            while (resourceName_l[i]);

            i = 0;
            do {
                if (resourceName_r[i]) {
                    recoverResource(resourceName_r[i], 'repeating_resource_$' + i + '_resource_right_name', resourceRecovery_r[i], 'repeating_resource_$' + i + '_resource_right', resourceMax_r[i]);
                }
                i++;
            }
            while (resourceName_r[i]);




        }
    });
});
